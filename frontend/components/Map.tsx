import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { MapProps, ChartDimensions } from '../types/index';
import { dataService } from '../services/dataService';

const Map: React.FC<MapProps> = ({ countries, setCountries, feature }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 1000,
    height: 500,
    margin: { top: 10, right: 10, bottom: 10, left: 10 }
  });

  // Update dimensions based on container size
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(rect.width, 300);
      const h = Math.max(rect.height, 250);
      
      setDimensions({
        width: w,
        height: h,
        margin: { 
          top: Math.round(h * 0.02),
          right: Math.round(w * 0.02), 
          bottom: Math.round(h * 0.15),
          left: Math.round(w * 0.02)
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

  // Separate data loading from visualization
  const loadData = useCallback(async () => {
    if (dataService.isLoaded()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await dataService.loadAllData();
    } catch (error) {
      console.error('Error loading map data:', error);
      setError('Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Visualization rendering (only re-runs when necessary)
  const drawVisualization = useCallback(() => {
    if (!svgRef.current || !dataService.isLoaded()) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.selectAll(".map-tooltip").remove();

    const geoData = dataService.getGeoData();
    const worldData = dataService.getWorldData();

    // Add zoom functionality
    const handleZoom = (event: any) => {
      const newTransform = event.transform;
      d3.select(svgRef.current).select('g')
        .attr('transform', newTransform.toString());
      setTransform(newTransform);
    };

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', handleZoom);

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .call(zoom);

    const chart = svg.append("g")
      .attr("class", "map-container");

    // Apply initial transform if exists
    if (transform) {
      chart.attr("transform", transform.toString());
    }

    // Responsive map projection
    const scale = Math.min(dimensions.width, dimensions.height) * 0.15;
    const projection = d3.geoNaturalEarth1()
      .scale(scale)
      .translate([dimensions.width / 2, dimensions.height / 2]);

    const path = d3.geoPath().projection(projection);

    // Create tooltip with new palette
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "map-tooltip")
      .style("position", "absolute")
      .style("background", "#1F2937") // Dark text color from palette
      .style("color", "#FFFFFF") // White text
      .style("border", "1px solid #9CA3AF") // Border from palette
      .style("border-radius", "8px")
      .style("padding", "10px")
      .style("font-size", `${Math.max(10, dimensions.width * 0.012)}px`)
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 20px rgba(30, 58, 138, 0.25)"); // Blue shadow

    // Create color scale
    const values = dataService.getNumericValues(feature).filter(v => v > 0 && !isNaN(v));
    
    // Color interpolator
    const customInterpolator = (t: number) => {
      if (t < 0.5) {
        const localT = t * 2;
        return d3.interpolate('#EFF6FF', '#1E3A8A')(localT);
      } else {
        const localT = (t - 0.5) * 2;
        return d3.interpolate('#1E3A8A', '#EA580C')(localT);
      }
    };
    
    let colorScale;
    if (feature === 'Life expectancy') {
      colorScale = d3.scaleSequential(customInterpolator)
        .domain(d3.extent(values) as [number, number]);
    } else {
      const sortedValues = values.slice().sort((a, b) => a - b);
      const minVal = d3.quantile(sortedValues, 0.05) || sortedValues[0];
      const maxVal = d3.quantile(sortedValues, 0.95) || sortedValues[sortedValues.length - 1];
      
      colorScale = d3.scaleSequential(customInterpolator)
        .domain([minVal, maxVal])
        .clamp(true);
    }

    // Responsive stroke width
    const strokeWidth = Math.max(0.3, dimensions.width * 0.0005);
    const selectedStrokeWidth = Math.max(1, dimensions.width * 0.002);

    // Helper to extract country name
    const getCountryName = (d: any) => 
      d.properties?.NAME || d.properties?.Country || d.properties?.name;

    // Mouse event handlers
    const mouseOver = function(this: SVGPathElement, event: any, d: any) {
      d3.selectAll(".country").style("opacity", 0.5);
      d3.select(this).style("opacity", 1).style("stroke-width", selectedStrokeWidth * 1.5);
      tooltip.style("opacity", 1);
    };

    const mouseMove = function(this: SVGPathElement, event: MouseEvent, d: any) {
      const countryName = getCountryName(d) || 'Unknown';
      const countryData = worldData.get(countryName);
      const featureValue = countryData ? countryData[feature] : 'N/A';
      
      tooltip
        .html(`
          <strong>${countryName}</strong><br/>
          ${feature}: <strong>${featureValue || 'No data'}</strong>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    };

    const mouseLeave = function() {
      d3.selectAll(".country").style("opacity", 0.8).style("stroke-width", strokeWidth);
      tooltip.style("opacity", 0);
    };

    const mouseClick = function(this: SVGPathElement, event: MouseEvent, d: any) {
      event.stopPropagation();
      const countryName = getCountryName(d);
      
      if (countryName) {
        const isSelected = countries.includes(countryName);
        setCountries(isSelected 
          ? countries.filter(c => c !== countryName)
          : [...countries, countryName]
        );
      }
    };

    // Draw countries
    const features = geoData?.features || [];
    
    if (features.length === 0) {
      return;
    }
    
    chart.append("g")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", path as any)
      .attr('fill', (d: any) => {
        const countryName = getCountryName(d);
        const countryData = worldData.get(countryName);
        
        if (!countryData) return '#E5E7EB'; // Light gray from our palette
        
        let value = countryData[feature];
        if (typeof value === 'string') {
          value = value.replace(/[,\$%]/g, '');
        }
        const numValue = parseFloat(value);
        
        if (isNaN(numValue) || numValue <= 0) return '#E5E7EB'; // Light gray from our palette
        
        // Apply color scale (quantile-based scaling handles outliers automatically)
        return colorScale(numValue);
      })
      .style("stroke", (d: any) => {
        const countryName = getCountryName(d);
        return countries.includes(countryName) ? "#EA580C" : "#374151"; // Orange for selected, dark gray for default
      })
      .style("stroke-width", (d: any) => {
        const countryName = getCountryName(d);
        return countries.includes(countryName) ? selectedStrokeWidth : strokeWidth;
      })
      .style("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", mouseOver)
      .on("mousemove", mouseMove)
      .on("mouseleave", mouseLeave)
      .on("click", mouseClick);

    // Add responsive legend
    const legendWidth = Math.min(300, dimensions.width * 0.4);
    const legendHeight = Math.max(12, dimensions.height * 0.025);
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${(dimensions.width - legendWidth) / 2}, ${dimensions.height - dimensions.margin.bottom + 20})`);

    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth]);

    // Create gradient for legend
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = colorScale.domain()[0] + t * (colorScale.domain()[1] - colorScale.domain()[0]);
      gradient.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(value));
    }

    // Legend rectangle
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .style("stroke", "#374151") // Dark gray from palette
      .style("stroke-width", 1.5);

    // Responsive legend ticks and labels with refined typography
    const numTicks = Math.min(5, Math.floor(legendWidth / 80));
    const tickFormat = d3.format(feature === 'Population' ? '.0s' : feature === 'Life expectancy' ? '.0f' : '.1s');
    const legendTextSize = Math.max(8, dimensions.width * 0.012);
    const legendTitleSize = Math.max(10, dimensions.width * 0.015);
    
    for (let i = 0; i <= numTicks; i++) {
      const t = i / numTicks;
      const value = colorScale.domain()[0] + t * (colorScale.domain()[1] - colorScale.domain()[0]);
      const x = t * legendWidth;
      
      // Tick line
      legend.append("line")
        .attr("x1", x)
        .attr("y1", legendHeight)
        .attr("x2", x)
        .attr("y2", legendHeight + 5)
        .style("stroke", "#374151") // Dark gray from palette
        .style("stroke-width", 1);
      
      // Tick label with enhanced typography
      legend.append("text")
        .attr("x", x)
        .attr("y", legendHeight + 18)
        .attr("text-anchor", "middle")
        .style("font-size", `${legendTextSize}px`)
        .style("fill", "#1F2937") // Dark text from palette
        .style("font-weight", "500")
        .style("letter-spacing", "0.2px")
        .text(tickFormat(value));
    }

    // Legend title with improved styling
    legend.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", `${legendTitleSize}px`)
      .style("font-weight", "600")
      .style("fill", "#1E3A8A") // Primary blue from palette
      .style("letter-spacing", "0.5px")
      .text(feature);

  }, [dimensions, feature, countries, setCountries, transform]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Redraw when dependencies change
  useEffect(() => {
    if (!isLoading && !error) {
      drawVisualization();
    }
  }, [drawVisualization, isLoading, error]);

  if (error) {
    return (
      <div ref={containerRef} className="map-container" style={{ 
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
      <div ref={containerRef} className="map-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        Loading map data...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="map-container">
      <svg ref={svgRef} className="responsive-svg" />
    </div>
  );
};

export default Map;