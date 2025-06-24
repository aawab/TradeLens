import React, {useEffect, useRef, useState} from 'react';
import * as d3 from "d3";

function BarChart({k, setK}){
    
    const ref = useRef(null)

    const mseData = [4192.208285950465, 2957.257034033883, 2482.2866645417175, 2092.231873076597, 1978.7127033802503, 1773.1183702411172, 1683.8174884991984, 1587.8448375236683, 1411.0062960787684, 1272.6786662918385]
    const margin = { top: 30, right: 0, bottom: 40, left: 70 };
    const width = 711 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    useEffect(() =>{
        d3.select(ref.current).selectAll("svg > *").remove()
        draw()
    }, [k])

    function draw(){
        if (mseData!=null){
            // Base Chart
            const chart = d3.select(ref.current)
            .attr("height",height + margin.top + margin.bottom)
            .attr("width",width + margin.left + margin.right)
            .append("g")
            .attr("transform",`translate(${margin.left},${margin.top})`); 

            // Add xAxis
            const xAxis = d3.scaleBand()
            .domain(mseData.map((d,i) => i+1))
            .range([0, width])
            .padding(0.1)

            chart.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xAxis))

            chart.append('text')
            .style("font-size", "14px")
            .attr("transform", `translate(${width/2}, ${height + margin.bottom})`)
            .style("text-anchor", "middle")
            .text("k")

            // Add yAxis
            const yAxis = d3.scaleLinear()
            .domain([0, 10000])
            .range([height, 0])

            chart.append('g')
            .call(d3.axisLeft(yAxis))

            chart.append('text')
            .style("font-size", "14px")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "20")
            .style("text-anchor", "middle")
            .text("Means Squared Error(MSE)")

            // Bars
            chart.selectAll("rect")
            .data(mseData)
            .enter()
            .append("rect")
            .attr("x",(d,i) => xAxis(i+1)) 
            .attr("y",(d,i) => yAxis(d))
            .attr("width", xAxis.bandwidth())
            .attr("height",(d,i)=> height - yAxis(d))
            .style("fill", (d,i)=> i+1==k? "darkorange":"steelblue")
            .on("click", (d, i) => {
                setK(mseData.indexOf(i)+1)
            })

            // Add vertical line to identify elbow
            const elbowLine = xAxis(4) + xAxis.bandwidth()/2
            chart.append('line')
            .attr('x1', elbowLine)
            .attr('y1', 50)
            .attr('x2', elbowLine)
            .attr('y2', height)
            .style('stroke', 'darkorange')
            .style('stroke-dasharray', '5,5');

            // Add text label for elbow
            chart.append("text")
            .attr("x", elbowLine)
            .attr("y", 0+height/2)
            .style("font-size", "18px")
            .style("text-anchor", "middle")
            .style("fill", "darkorange")
            .text("Elbow")
        }
    }

    return(
        <svg ref = {ref}></svg>
    )
}

export default BarChart;