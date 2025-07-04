import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import type { ScatterPlotProps, ChartDimensions, ChartFeature } from '../types/index';
import { dataService } from '../services/dataService';
import { useAppStore } from '../stores/appStore';

const ScatterPlot: React.FC<ScatterPlotProps> = ({ 
  selectedCountries, 
  xVariable, 
  yVariable 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { k } = useAppStore();
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 480,
    height: 300,
    margin: { 
      top: Math.round(300 * 0.05),
      right: Math.round(480 * 0.12),
      bottom: Math.round(300 * 0.12),
      left: Math.round(480 * 0.08)
    }
  });

  // Update dimensions based on container size
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(rect.width, 250);
      const h = Math.max(rect.height, 200);
      
      setDimensions({
        width: w,
        height: h,
        margin: { 
          top: Math.round(h * 0.05),
          right: Math.round(w * 0.12),
          bottom: Math.round(h * 0.12),
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

  const drawScatterPlot = useCallback(() => {
    if (!svgRef.current || !dataService.isLoaded()) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.selectAll(".scatter-tooltip").remove();

    const worldData = dataService.getWorldData();
    
    // Filter data based on selection
    const allData = Array.from(worldData.values());
    const filteredData = selectedCountries.length > 0 
      ? allData.filter(d => selectedCountries.includes(d.Country))
      : allData.slice(0, 50);
    
    if (filteredData.length === 0) return;

    // Prepare data for scatter plot
    const data = filteredData.map(d => ({
      country: d.Country,
      x: getValue(d, xVariable),
      y: getValue(d, yVariable)
    })).filter(d => 
      !isNaN(d.x) && !isNaN(d.y) && 
      isFinite(d.x) && isFinite(d.y) &&
      d.x > 0 && d.y > 0
    );

    if (data.length === 0) return;

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    // Chart dimensions
    const chartWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const chartHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    const chart = svg.append("g")
      .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

    // Create scales
    const xExtent = d3.extent(data, d => d.x) as [number, number];
    const yExtent = d3.extent(data, d => d.y) as [number, number];
        
        // Initialize the X axis
    const xScale = xVariable === 'Life expectancy' 
      ? d3.scaleLinear().domain(xExtent).range([0, chartWidth]).nice()
      : d3.scaleLog().domain([Math.max(xExtent[0], 1), xExtent[1]]).range([0, chartWidth]).nice();

        // Initialize the Y axis
    const yScale = yVariable === 'Life expectancy'
      ? d3.scaleLinear().domain(yExtent).range([chartHeight, 0]).nice()
      : d3.scaleLog().domain([Math.max(yExtent[0], 1), yExtent[1]]).range([chartHeight, 0]).nice();

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

    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "scatter-tooltip")
      .style("position", "absolute")
      .style("background", "#1F2937")
      .style("color", "#FFFFFF")
      .style("border", "1px solid #9CA3AF")
      .style("border-radius", "8px")
      .style("padding", "10px")
      .style("font-size", `${Math.max(10, dimensions.width * 0.025)}px`)
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 20px rgba(30, 58, 138, 0.25)");

     // Add axes
     const xTickCount = Math.max(2, Math.min(3, Math.floor(chartWidth / 150)));
     const yTickCount = Math.max(2, Math.min(3, Math.floor(chartHeight / 80)));

     const tickFormat = (variable: ChartFeature) => {
       if (variable === 'Life expectancy') return d3.format('.1f');
       return d3.format('.1s');
     };

         chart.append("g")
       .attr("transform", `translate(0, ${chartHeight})`)
       .call(d3.axisBottom(xScale)
         .ticks(xTickCount)
         .tickFormat(tickFormat(xVariable) as any)
       )
      .selectAll("text")
      .style("font-size", `${Math.max(8, dimensions.width * 0.018)}px`)
      .style("fill", "#374151")
      .style("font-weight", "500");

         chart.append("g")
       .call(d3.axisLeft(yScale)
         .ticks(yTickCount)
         .tickFormat(tickFormat(yVariable) as any)
       )
      .selectAll("text")
      .style("font-size", `${Math.max(8, dimensions.width * 0.018)}px`)
      .style("fill", "#374151")
      .style("font-weight", "500");

    // Add axis labels
            svg.append("text")
      .attr("transform", `translate(${dimensions.width * 0.5}, ${dimensions.height * 0.96})`)
            .style("text-anchor", "middle")
      .style("font-size", `${Math.max(9, dimensions.height * 0.028)}px`)
      .style("font-weight", "600")
      .style("fill", "#1E3A8A")
      .style("letter-spacing", "0.5px")
      .text(xVariable);

            svg.append("text")
            .attr("transform", "rotate(-90)")
      .attr("x", -dimensions.height * 0.5)
      .attr("y", dimensions.width * 0.035)
            .style("text-anchor", "middle")
      .style("font-size", `${Math.max(9, dimensions.height * 0.028)}px`)
      .style("font-weight", "600")
      .style("fill", "#1E3A8A")
      .style("letter-spacing", "0.5px")
      .text(yVariable);

    // K-means clustering assignment
    const assignCluster = (point: any) => {
      const xValues = data.map(d => d.x).sort((a, b) => a - b);
      const yValues = data.map(d => d.y).sort((a, b) => a - b);
      
      const xPercentile = xValues.indexOf(point.x) / xValues.length;
      const yPercentile = yValues.indexOf(point.y) / yValues.length;
      
      const clusterIndex = Math.floor((xPercentile + yPercentile) * k / 2);
      return Math.min(clusterIndex, k - 1);
    };

    // Add data points
    const dataPointRadius = Math.max(2, dimensions.height * 0.01);
    
    svg.selectAll(".data-point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", d => xScale(Math.max(d.x, xVariable === 'Life expectancy' ? 0 : 1)) + dimensions.margin.left)
      .attr("cy", d => yScale(Math.max(d.y, yVariable === 'Life expectancy' ? 0 : 1)) + dimensions.margin.top)
      .attr("r", dataPointRadius)
      .attr("fill", d => colors(assignCluster(d).toString()))
      .attr("stroke", "#374151") // Dark gray from palette
      .attr("stroke-width", 0.5)
      .style("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
            .transition()
          .duration(100)
          .attr("r", dataPointRadius * 1.67) // 67% larger on hover
          .style("opacity", 1);
        
        tooltip
          .style("opacity", 1)
                     .html(`
             <strong>${d.country}</strong><br/>
             ${xVariable}: <strong>${d3.format(xVariable === 'Life expectancy' ? '.1f' : '.1s')(d.x)}</strong><br/>
             ${yVariable}: <strong>${d3.format(yVariable === 'Life expectancy' ? '.1f' : '.1s')(d.y)}</strong><br/>
             Cluster: <strong>${assignCluster(d)}</strong>
           `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseleave", function() {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", dataPointRadius)
          .style("opacity", 0.8);
        
        tooltip.style("opacity", 0);
      });

    // Calculate and draw regression line
    const leastSquares = (xSeries: number[], ySeries: number[]) => {
      const n = Math.min(xSeries.length, ySeries.length);
      const xMean = d3.mean(xSeries) || 0;
      const yMean = d3.mean(ySeries) || 0;
      
      let num = 0;
      let den = 0;
      
      for (let i = 0; i < n; i++) {
        num += (xSeries[i] - xMean) * (ySeries[i] - yMean);
        den += (xSeries[i] - xMean) * (xSeries[i] - xMean);
      }
      
      const slope = den === 0 ? 0 : num / den;
      const intercept = yMean - slope * xMean;
      
      return { slope, intercept };
    };

    const calculateCorrelation = (xSeries: number[], ySeries: number[]) => {
      const n = Math.min(xSeries.length, ySeries.length);
      const xMean = d3.mean(xSeries) || 0;
      const yMean = d3.mean(ySeries) || 0;
      
      let num = 0;
      let xDen = 0;
      let yDen = 0;
      
      for (let i = 0; i < n; i++) {
        const xDiff = xSeries[i] - xMean;
        const yDiff = ySeries[i] - yMean;
        num += xDiff * yDiff;
        xDen += xDiff * xDiff;
        yDen += yDiff * yDiff;
      }
      
      const den = Math.sqrt(xDen * yDen);
      return den === 0 ? 0 : num / den;
    };

    const regression = leastSquares(
      data.map(d => d.x),
      data.map(d => d.y)
    );

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(Math.max(d[0], xVariable === 'Life expectancy' ? 0 : 1)) + dimensions.margin.left)
      .y(d => yScale(Math.max(d[1], yVariable === 'Life expectancy' ? 0 : 1)) + dimensions.margin.top);

    const xDomain = [Math.max(xExtent[0], 1), xExtent[1]];
    const lineData: [number, number][] = [
      [xDomain[0], regression.intercept + regression.slope * xDomain[0]],
      [xDomain[1], regression.intercept + regression.slope * xDomain[1]]
    ];

    svg.append("path")
      .datum(lineData)
      .attr("class", "regression-line")
      .attr("d", lineGenerator)
      .attr("stroke", "#EA580C") // Primary orange from palette
      .attr("stroke-width", Math.max(1.5, dimensions.width * 0.005))
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    // Add correlation info
    const correlation = calculateCorrelation(
      data.map(d => d.x),
      data.map(d => d.y)
    );

    // Add responsive correlation text
    svg.append("text")
      .attr("x", dimensions.width * 0.88)  // 88% of width
      .attr("y", dimensions.height * 0.08) // 8% of height
      .style("text-anchor", "start")
      .style("font-size", `${Math.max(6, dimensions.height * 0.025)}px`) // 2.5% of height, min 6px
      .style("fill", "#374151") // Medium gray from palette
      .style("font-weight", "bold")
      .text(`r=${correlation.toFixed(3)}`);

    // Add refined legend with improved typography
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${dimensions.width * 0.88}, ${dimensions.height * 0.15})`);

    // Refined legend typography settings
    const legendTitleSize = Math.max(8, dimensions.height * 0.028);
    const legendTextSize = Math.max(6, dimensions.height * 0.022);
    const legendSpacing = dimensions.height * 0.035;
    const legendCircleRadius = Math.max(2, dimensions.height * 0.01);
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", -legendTitleSize * 0.2)
      .style("font-size", `${legendTitleSize}px`)
      .style("font-weight", "600")
      .style("fill", "#1E3A8A") // Primary blue from palette
      .style("letter-spacing", "0.3px")
      .text("Clusters");

    for (let i = 0; i < k; i++) {
      legend.append("circle")
        .attr("cx", 0)
        .attr("cy", i * legendSpacing + legendTitleSize)
        .attr("r", legendCircleRadius)
                 .attr("fill", colors(i.toString()))
        .attr("stroke", "#374151") // Dark gray from palette
        .attr("stroke-width", 0.5);

      legend.append("text")
        .attr("x", legendCircleRadius * 2.5)
        .attr("y", i * legendSpacing + legendTitleSize + legendTextSize * 0.3)
        .style("font-size", `${legendTextSize}px`)
        .style("fill", "#1F2937") // Dark text from palette
        .style("font-weight", "500")
        .style("letter-spacing", "0.1px")
        .text(`C${i}`);
    }

    // Add responsive data count
    svg.append("text")
      .attr("x", dimensions.width * 0.05)  // 5% from left edge
      .attr("y", dimensions.height * 0.04) // 4% from top
      .style("font-size", `${Math.max(6, dimensions.height * 0.025)}px`) // 2.5% of height, min 6px
      .style("fill", "#6B7280") // Light gray from palette
      .style("font-weight", "bold")
      .text(`${data.length} pts • k=${k}`);

  }, [dimensions, selectedCountries, xVariable, yVariable, k]);

  const getValue = (d: any, variable: ChartFeature) => {
    const value = d[variable];
    if (typeof value === 'string') {
      return parseFloat(value.replace(/[,\$%]/g, ''));
    }
    return value || 0;
  };

  // Load data and redraw when dependencies change
  useEffect(() => {
    if (dataService.isLoaded()) {
      drawScatterPlot();
    }
  }, [drawScatterPlot]);

  return (
    <div ref={containerRef} className="scatter-container">
      <svg ref={svgRef} className="responsive-svg" />
    </div>
  );
};

export default ScatterPlot;