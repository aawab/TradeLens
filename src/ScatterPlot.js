import React, {useEffect, useRef} from 'react';
import * as d3 from "d3";
import csvFile from "./final.csv";

const margin = { top: 20, right: 20, bottom: 100, left: 70 };
const width = 900
const height = 530

function ScatterPlot({k, scatterVariables}) {

    const ref = useRef();

    useEffect(() => {
        if (scatterVariables==null || Object.keys(scatterVariables).length!==2) return
        d3.select(ref.current).selectAll("g").remove()

        const svg = d3.select(ref.current)
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        
        // Initialize the X axis
        var x, xAxis;
        var x = d3.scaleLinear().range([0, width]);
        var xAxis = svg.append("g").attr("transform", "translate(0," + height + ")");

        // Initialize the Y axis
        var y, yAxis;
        var y = d3.scaleLinear().range([height, 0]);
        var yAxis = svg.append("g");

        // Import csv data and setup axes labels and bars
        d3.csv(csvFile).then(function(csv) {

            const colors = d3.scaleOrdinal(d3.schemeCategory10);
            
            // Update the X axis
            x.domain(d3.extent(csv, d=>parseFloat(d[scatterVariables.x])));
            xAxis.transition().duration(1000).call(d3.axisBottom(x));
            svg.append("text")
            .attr("transform", `translate(${width/2}, ${height + margin.bottom- 40})`)
            .style("text-anchor", "middle")
            .text(scatterVariables.x);
            
            // Update the Y axis
            y.domain(d3.extent(csv, d=>parseFloat(d[scatterVariables.y])));
            yAxis.transition().duration(1000).call(d3.axisLeft(y));
            svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "20")
            .style("text-anchor", "middle")
            .text(scatterVariables.y);

            // U var for the data points
            var u = svg.selectAll("dot").data(csv);

            u.join("circle")  
            .transition()
            .duration(1000)
            .attr("cx", (d) => x(d[scatterVariables.x]))
            .attr("cy", (d) => y(d[scatterVariables.y]))
            .attr("r",5)
            .attr("fill", (d)=>colors(d[k])); 
        })
    }, [k, scatterVariables])

    return(
        <svg ref = {ref}></svg>
    )
}

export default ScatterPlot;