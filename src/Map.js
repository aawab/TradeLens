import React, {useEffect, useState, useRef} from 'react';
import * as d3 from "d3";
import map from './worldWithData.geojson'
import csv from './world-data-2023.csv'

function Map({countries, setCountries, feature}) {

    let ref = useRef();

    let [transform, setTransform] = useState()

    const margin = { top: 60, right: 20, bottom: 40, left: 40 };
    const width = 1200
    const height =600

    useEffect(()=>{
        d3.select(ref.current).selectAll("svg > *").remove()
        d3.selectAll(".tooltip").remove()
        draw()
    }, [countries, feature])

    function draw(){
        
        // Add zoom
        function handleZoom(e){
            d3.select('svg g')
            .attr('transform', e.transform)
            setTransform(e.transform)
        }   
        let zoom = d3.zoom()
        .on('zoom', handleZoom)

        const chart = d3.select(ref.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height)
        .append("g")    
        .attr("transform", transform)
        
        
        d3.select('svg').call(zoom)

        const projection = d3.geoMercator()
        .scale(200)
        .center([0, 20])
        .translate([width/2, height/2])

        Promise.all([d3.json(map), d3.csv(csv)]).then(function(returnArray){

            // Mouseover events and tooltips
            var tooltip = d3.select("body")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "absolute")

            let mouseOver = function(d) {
                d3.selectAll(".Country")
                  .style("opacity", .5)
                d3.select(this)
                  .style("opacity", 1)
                tooltip.style("opacity",1)
            }

            let mouseMove = function(d) {
                tooltip.html(`${d.originalTarget.__data__.properties["Country"]}<br>${feature}:  ${d.originalTarget.__data__.properties[feature]}`)
                .style("left", d.clientX+90 + "px")
                .style("top", d.clientY + "px")
            }

            let mouseLeave = function(d) {
                d3.selectAll(".Country")
                  .style("opacity", .8)
                tooltip.style("opacity",0)
            }

            let mouseClick = function(d){
                if (countries.includes(d.target.__data__.properties.name)){
                    setCountries(countries.filter(c=>c!==d.target.__data__.properties.name))
                }
                else{
                    setCountries([...countries,d.target.__data__.properties.name])
                }
            }

            // Data and colors
            const topo = returnArray[0]
            const data = returnArray[1]
            const colors = d3.scaleQuantile()
            .domain(data.map(d=>{
                let num = d[feature]
                if (num!=undefined){
                    num = num.replace(/,/g, '')
                    num = num.replace('$', '')
                    num = num.replace('%', '')
                }
                console.log(num)
                return parseFloat(num)
            }))
            .range(d3.schemeBlues[9])

            chart.append("g")
            .selectAll("path")
            .data(topo.features)
            .enter()
            .append("path")
            .attr("d", d3.geoPath()
                .projection(projection))
            // set color of each country
            .attr('fill', (d) => {
                let num = d.properties[feature]
                if (num!=undefined){
                    num = num.replace(/,/g, '')
                    num = num.replace('$', '')
                }
                return colors(parseFloat(num))
            })
            .style("stroke", (d)=> {
                if (countries.includes(d.properties.name)){
                    return "orange"
                }
            })
            .attr("class", "Country")
            .style("opacity", .8)
            .on("mouseover", mouseOver)
            .on("mousemove", mouseMove)
            .on("mouseleave", mouseLeave)
            .on("click", mouseClick)
        })
    }

    return(
        <svg ref={ref}></svg>
    )
}

export default Map;