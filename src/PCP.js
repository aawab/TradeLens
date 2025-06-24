import React, {useEffect, useRef} from 'react';
import * as d3 from "d3";
import data from './final.csv'

function PCP({k, orderVars, countries}){

    let ref = useRef();
    
    // set the dimensions and margins of the graph
    const margin = {top: 60, right: 50, bottom: 10, left: 40};
    const width = 1700
    const height =500

    var columns = ["Sales Per Customer","Item Discount Rate","Item Profit Ratio","Item Quantity","Sales","Order Total","Profit Per Order","Product Price", "Delivery Status", "Co2-Emissions",  "Population", "Order Country", "Category Name", "Customer Segment", "Department Name", "GDP"]
    const categorical = ["Delivery Status", "Category Name", "Customer Segment", "Department Name", "Order Country"]
    
    useEffect(() =>{
        d3.select(ref.current).selectAll("svg > *").remove()
        if (orderVars.length>0){
            columns = orderVars
        }
        draw()
    }, [k, orderVars, countries])

    function draw(){

        // Base Chart
        const chart = d3.select(ref.current)
        .attr("height",height + margin.top + margin.bottom)
        .attr("width",width + margin.left + margin.right)
        .append("g")
        .attr("transform",`translate(${margin.left},${20})`); 

        d3.csv(data).then(function(csv) {

            let activeBrushes = new Map()
            
            const colors = d3.scaleOrdinal(d3.schemeCategory10)

            // Create scales
            const y = {};
            columns.forEach(dim => {
                if (categorical.includes(dim)) {
                    const counts = d3.rollup(csv, (d)=>d.length, (d) => d[dim])
                    const yData = Array.from(counts, ([key, value]) => ({ key, value }))
                    console.log(yData)
                    if (dim=="Order Country"){
                        y[dim] = d3.scaleBand()
                        .domain(yData.map((d) => {
                            if (countries.includes(d.key)){
                                return d.key
                            }
                        }))
                        .range([height, 0])
                    }
                    else{
                        y[dim] = d3.scaleBand()
                        .domain(yData.map((d) => d.key))
                        .range([height, 0])
                    }
                }
                else{
                    y[dim] = d3.scaleLinear()
                    .domain(d3.extent(csv, d => parseFloat(d[dim])))
                    .range([height, 0])
                    .nice()
                }
                
            });

            const x = d3.scalePoint()
            .range([0, width])
            .padding(1)
            .domain(columns)
            
            var dragging = {}

            // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
            function path(d) {
                return d3.line()(columns.map(function(dim) { 
                    return [dragging[dim] == undefined? x(dim) : dragging[dim], y[dim](d[dim])]; 
                }));
            }

            // Draw the lines
            var lines = chart.selectAll("myPath")
            .data(csv)
            .enter().append("path")
            .attr("d",  path)
            .style("fill", "none")
            .style("stroke", (d) => colors(d[k]))
            .style("opacity", 0.7)

            function position(d) {
                var v = dragging[d];
                return v == null ? x(d) : v;
            }
            
            function transition(g) {
                return g.transition().duration(500);
            }

            // Draw the axis:
            var axes = chart.selectAll(".dimension")
            .data(columns).enter()
            .append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .call(d3.drag()
            .on("start", function(event){
                dragging[event.subject] = x(event.subject)
            })
            .on("drag", function(event){
                console.log(event)
                dragging[event.subject] = Math.min(width, Math.max(0, event.x))
                lines.attr("d", path)
                columns.sort((a, b) => {return position(a) - position(b)})
                x.domain(columns)
                axes.attr("transform", (d)=>{ return `translate(${position(d)})`})
            })
            .on("end", function(event){
                delete dragging[event.subject]
                transition(d3.select(this)).attr("transform", `translate(${x(event.subject)})`)
                transition(lines).attr("d",path)
            })
            );

            axes.append("g")
            .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
            .append("text")
            .style("text-anchor", "middle")
            .style("fill", "white")
            .attr("y", -9)
            .text(function(d) { return d; })
        })
    }

    return(
        <div width={"fit-content"} style={{width:'fit-content'}}>
            <svg ref={ref}></svg>
        </div>
    );
}



export default PCP;