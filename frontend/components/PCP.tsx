import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import type { PCPProps, ChartDimensions } from '../types/index';
import { dataService } from '../services/dataService';
import { useAppStore } from '../stores/appStore';

const PCP: React.FC<PCPProps> = ({ selectedCountries }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { k } = useAppStore();
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 900,
    height: 400,
    margin: { top: 60, right: 80, bottom: 50, left: 80 }
  });

  const columns = ["Co2-Emissions", "GDP", "Population", "Life expectancy"];

  // Update dimensions based on container size
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(rect.width, 400);
      const h = Math.max(rect.height, 250);
      
      setDimensions({
        width: w,
        height: h,
        margin: { 
          top: Math.round(h * 0.15),
          right: Math.round(w * 0.08),
          bottom: Math.round(h * 0.15),
          left: Math.round(w * 0.08)
        }
      });
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Load data on mount
  const loadData = useCallback(async () => {
    if (dataService.isLoaded()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await dataService.loadAllData();
    } catch (error) {
      console.error('Error loading PCP data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Visualization rendering
  const drawVisualization = useCallback(() => {
    if (!svgRef.current || !dataService.isLoaded()) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.selectAll(".pcp-tooltip").remove();

    const allData = dataService.getValidDataForPCP(columns);
    
    // Filter to only show selected countries, fallback to first 20 if none selected
    const filteredData = selectedCountries.length > 0 
      ? allData.filter(d => selectedCountries.includes(d.country))
      : allData.slice(0, 20);
    
    if (filteredData.length === 0) {
      // Show no data message
      const svg = d3.select(svgRef.current);
      svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", `${Math.max(12, dimensions.width * 0.018)}px`)
        .style("fill", "#666")
        .text(selectedCountries.length > 0 ? "No data for selected countries" : "No valid data available");
      return;
    }

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    // Calculate improved spacing for axes
    const chartWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const chartHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
    const axisSpacing = chartWidth / (columns.length - 1);

    // Create main chart group (no zoom functionality)
    const chartGroup = svg.append("g")
      .attr("class", "chart-group")
      .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

    // Calculate scales for each dimension
    const scales: { [key: string]: d3.ScaleLinear<number, number> } = {};

    columns.forEach((col, i) => {
      const extent = d3.extent(filteredData, d => d[col]) as [number, number];
      const minVal = Math.max(extent[0], 1);
      const maxVal = extent[1];
      
      if (col === 'Life expectancy') {
        scales[col] = d3.scaleLinear()
          .domain(extent)
          .range([chartHeight, 0])
          .nice();
      } else {
        scales[col] = d3.scaleLog()
          .domain([minVal, maxVal])
          .range([chartHeight, 0])
          .nice();
                    }
    });

    // Color scale for clusters
    const colors = d3.scaleOrdinal([
      '#1E3A8A',
      '#EA580C',
      '#3B82F6',
      '#FB923C',
      '#0891B2',
      '#F97316',
      '#374151',
      '#6B7280',
      '#E5E7EB',
      '#F8FAFC'
    ]);
    
    // K-means clustering assignment based on global k value
    const assignCluster = (point: any) => {
      // Simple clustering based on first two dimensions, distributed into k clusters
      const col1Values = filteredData.map(d => d[columns[0]]).sort((a, b) => a - b);
      const col2Values = filteredData.map(d => d[columns[1]]).sort((a, b) => a - b);

      const col1Percentile = col1Values.indexOf(point[columns[0]]) / col1Values.length;
      const col2Percentile = col2Values.indexOf(point[columns[1]]) / col2Values.length;
      
      // Distribute into k clusters based on percentiles
      const clusterIndex = Math.floor((col1Percentile + col2Percentile) * k / 2);
      return Math.min(clusterIndex, k - 1);
    };

    // Create tooltip with new palette
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "pcp-tooltip")
      .style("position", "absolute")
      .style("background", "#1F2937") // Dark text color from palette
      .style("color", "#FFFFFF") // White text
      .style("border", "1px solid #9CA3AF") // Border from palette
      .style("border-radius", "8px")
      .style("padding", "10px")
      .style("font-size", `${Math.max(10, dimensions.width * 0.014)}px`)
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 20px rgba(30, 58, 138, 0.25)"); // Blue shadow

    // Path generator for parallel coordinates lines
    const path = (d: any) => {
      return d3.line<[number, number]>()(
        columns.map((col, i) => [
          i * axisSpacing,
          scales[col](Math.max(d[col], col === 'Life expectancy' ? 0 : 1)) // Ensure positive values for log scale
        ])
      );
    };

    // Responsive line styling
    const strokeWidth = Math.max(1, dimensions.width * 0.002);

            // Draw the lines
    chartGroup.append("g")
      .selectAll("path")
      .data(filteredData)
      .enter()
      .append("path")
      .attr("class", "pcp-line")
      .attr("d", path)
            .style("fill", "none")
              .style("stroke", d => colors(assignCluster(d).toString()))
      .style("stroke-width", strokeWidth)
            .style("opacity", 0.7)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        // Highlight this line
        d3.selectAll(".pcp-line").style("opacity", 0.2);
        d3.select(this).style("opacity", 1).style("stroke-width", strokeWidth * 2);
        
        // Show tooltip
        tooltip
          .style("opacity", 1)
                     .html(`
             <strong>${d.country}</strong><br/>
             ${columns.map(col => {
               const format = col === 'Life expectancy' ? '.1f' : '.0s';
               return `${col}: <strong>${d3.format(format)(d[col])}</strong>`;
             }).join('<br/>')}
             <br/>Cluster: <strong>${assignCluster(d)}</strong>
           `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseleave", function() {
        // Reset all lines
        d3.selectAll(".pcp-line").style("opacity", 0.7).style("stroke-width", strokeWidth);
        tooltip.style("opacity", 0);
      });

    // Draw the axes with refined typography
    const axisLabelSize = Math.max(9, dimensions.width * 0.014);
    const tickLabelSize = Math.max(7, dimensions.width * 0.01);
    const tickSize = Math.max(3, dimensions.width * 0.003);

    columns.forEach((col, i) => {
      const xPos = i * axisSpacing;
      
      // Generate custom tick values for better spacing
      let tickFormat;
      let tickValues;
      
      if (col === 'Life expectancy') {
        // Linear scale - use regular ticks
        tickFormat = d3.format(".0f");
        const domain = scales[col].domain();
        const step = (domain[1] - domain[0]) / 4;
        tickValues = d3.range(domain[0], domain[1] + step, step);
      } else {
        // Log scale - generate evenly spaced tick values in log space
        tickFormat = d3.format(".0s");
        const domain = scales[col].domain();
        const logMin = Math.log10(domain[0]);
        const logMax = Math.log10(domain[1]);
        const step = (logMax - logMin) / 4;
        
        tickValues = d3.range(logMin, logMax + step, step).map(logVal => 
          Math.pow(10, logVal)
        );
      }
      
      // Axis line
      chartGroup.append("line")
        .attr("class", "axis-line")
        .attr("x1", xPos)
        .attr("y1", 0)
        .attr("x2", xPos)
        .attr("y2", chartHeight)
        .style("stroke", "#9CA3AF") // Border gray from palette
        .style("stroke-width", Math.max(0.5, dimensions.width * 0.0008));

      // Responsive ticks
      chartGroup.selectAll(`.tick-${i}`)
        .data(tickValues)
        .enter()
            .append("g")
        .attr("class", `tick-${i}`)
        .each(function(d) {
          const group = d3.select(this);
          const yPos = scales[col](d);
          
          // Tick line
          group.append("line")
            .attr("x1", xPos - tickSize)
            .attr("y1", yPos)
            .attr("x2", xPos + tickSize)
            .attr("y2", yPos)
            .style("stroke", "#9CA3AF") // Border gray from palette
            .style("stroke-width", Math.max(0.3, dimensions.width * 0.0006));
          
          // Tick label with enhanced typography
          group.append("text")
            .attr("x", xPos - tickSize * 2)
            .attr("y", yPos)
            .attr("text-anchor", "end")
            .attr("alignment-baseline", "middle")
            .style("font-size", `${tickLabelSize}px`)
            .style("fill", "#6B7280") // Light gray from palette
            .style("font-weight", "500")
            .text(tickFormat(d));
        });

      // Axis label with enhanced typography
      chartGroup.append("text")
        .attr("class", "axis-label")
        .attr("x", xPos)
        .attr("y", -dimensions.margin.top * 0.35)
        .attr("text-anchor", "middle")
        .style("font-size", `${axisLabelSize}px`)
        .style("font-weight", "600")
        .style("fill", "#1E3A8A") // Primary blue from palette
        .style("letter-spacing", "0.3px")
        .text(col);
    });

    // Add responsive legend with clusters - horizontally compact
    const legendWidth = Math.min(45, dimensions.width * 0.08);
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${dimensions.width - legendWidth - 8}, ${dimensions.margin.top})`);

    // Legend background with minimal horizontal padding, more vertical padding
    const legendPaddingHorizontal = Math.max(3, dimensions.width * 0.004);
    const legendPaddingVertical = Math.max(10, dimensions.width * 0.012);
    legend.append("rect")
      .attr("x", -legendPaddingHorizontal)
      .attr("y", -legendPaddingVertical)
      .attr("width", legendWidth + legendPaddingHorizontal * 2)
      .attr("height", (k * Math.max(14, dimensions.height * 0.035)) + legendPaddingVertical * 2)
      .style("fill", "rgba(255, 255, 255, 0.9)")
      .style("stroke", "#ddd")
      .style("stroke-width", 1)
      .style("rx", 3);

    // Legend title with enhanced typography
    const legendTitleSize = Math.max(7, dimensions.width * 0.012);
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .style("font-size", `${legendTitleSize}px`)
      .style("font-weight", "600")
      .style("fill", "#1E3A8A") // Primary blue from palette
      .style("letter-spacing", "0.2px")
      .text("Clusters");

    // Legend items with responsive spacing
    const legendSpacing = Math.max(14, dimensions.height * 0.035);
    const legendCircleRadius = Math.max(2.5, dimensions.width * 0.003);

    for (let i = 0; i < k; i++) {
      const group = legend.append("g")
        .attr("transform", `translate(0, ${(i + 1) * legendSpacing})`);

      group.append("circle")
        .attr("cx", legendCircleRadius)
        .attr("cy", 0)
        .attr("r", legendCircleRadius)
        .attr("fill", colors(i.toString()))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);

      group.append("text")
        .attr("x", legendCircleRadius * 2)
        .attr("y", 0)
        .attr("alignment-baseline", "middle")
        .style("font-size", `${Math.max(6, dimensions.width * 0.01)}px`)
        .style("fill", "#1F2937") // Dark text from palette
        .style("font-weight", "500")
        .text(`C${i}`);
    }

    // Add refined data count
    svg.append("text")
      .attr("x", dimensions.margin.left)
      .attr("y", dimensions.height - 10)
      .style("font-size", `${Math.max(7, dimensions.width * 0.011)}px`)
      .style("fill", "#6B7280") // Light gray from palette
      .style("font-weight", "600")
      .style("letter-spacing", "0.2px")
      .text(`${filteredData.length} countries • k=${k} clusters`);

  }, [selectedCountries, dimensions, k, columns]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Re-draw when data is loaded or dependencies change
  useEffect(() => {
    if (!isLoading && !error) {
      drawVisualization();
    }
  }, [drawVisualization, isLoading, error]);

  if (error) {
    return (
      <div ref={containerRef} className="pcp-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        Error: {error}
        </div>
    );
}

  if (isLoading) {
    return (
      <div ref={containerRef} className="pcp-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        Loading PCP data...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pcp-container">
      <svg ref={svgRef} className="responsive-svg" />
    </div>
  );
};

export default PCP;