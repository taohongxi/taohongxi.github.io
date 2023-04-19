d3.csv("WhatsgoodlyData-6.csv").then(function(data) {
     var width = window.innerWidth * 0.9;
     var height = window.innerHeight * 0.9;
     var colorMap = {
      "Facebook": "#3B5998",
      "Twitter": "#1DA1F2",
      "Snapchat": "#FFFC00",
      "Instagram": "#E1306C",
      "None": "#f6f4e7"
    };
     // Group the data by Segment Type, Segment Description, and Answer
     var groupedData = d3.group(data, d => d["Segment Type"], d => d["Segment Description"], d => d["Answer"]);
     
    // Format the nested data structure
    var formattedData = {
      name: "social influence shopping",
      children: Array.from(groupedData, ([segmentTypeKey, segmentTypeValues]) => ({
        name: segmentTypeKey,
        children: Array.from(segmentTypeValues, ([segmentDescriptionKey, segmentDescriptionValues]) => {
          var max = 0;
          var color = "white";
          var info = [];
          var total = 0;
          Array.from(segmentDescriptionValues, ([answerKey, answerValues]) => {
            var count = +answerValues[0]["Count"];
            var name_key = answerValues[0]["Answer"];
            info.push({
              Name: name_key,
              Count: count
            });
            total += count;
            if (count > max && colorMap[name_key]) {
              max = count;
              color = colorMap[name_key];
            }
          })
          return {
            name: segmentDescriptionKey,
            color: color,
            max: max,
            total: total,
            children: info.map(d => ({
              name: d.Name,
              count: d.Count
            }))
          };
        })
      }))
    };
    // Create a pack layout
    var pack = d3.pack()
    .size([500, 500])
    .padding(5);

    // Convert the formatted data to a hierarchy
    var hierarchy = d3.hierarchy(formattedData)
    .sum(d => d.count);

    // Compute the circle packing layout
    pack(hierarchy);
    console.log(hierarchy)
   

     // Select the visualization container and create an SVG element
     var svg = d3.select("#visualization")
     .append("svg")
     .attr("width", width)
     .attr("height", height);

    //  console.log(packData)
     
      // Add zoom behavior to the SVG element
      const zoom = d3.zoom()
      .on('zoom', (event) => {
        packGroup.attr('transform', event.transform);
      })
      .scaleExtent([1, 40]);
                            
     // Create a group element for the circle packing diagram
     var packGroup = svg.call(zoom).append("g")
     .attr("transform", "translate(250, 250)");
      // Filter the descendants to include only "Segment" and "Segment Description" circles
      var circles = packGroup.selectAll("circle")
      .data(hierarchy.descendants().filter(d => d.depth <= 2))
      .enter()
      .append("circle")
      .attr("class", d => {if(d.depth===2){return "segment-description"}})//d.depth === 1 ? "segment" : "segment-description")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", d => {
        if (d.depth === 0) {
          return "white";
        } else if (d.depth === 1) {
          return "#C8D7DF";
        } else {
          
          return d.data.color;
        }
      });
      // .attr("stroke", "white");

      

    const pie = d3.pie()
    .value(d => d.count)
    .sort(null)
    // .each((d, i, arr) => {
    //   const circle = arr[i].data.circle;
    //   d.r = circle.r; // add the circle's radius to the data of each pie slice
    // });

    
    // Define the arc function to be used to draw the outer ring
    var arc = d3.arc()
        .innerRadius(d => d.r)
        .outerRadius(d => d.r+1);

    // Add the outer ring to the "Segment description" circles
    var rings = packGroup.selectAll(".ring")
        .data(hierarchy.descendants().filter(d => d.depth === 2))
        .enter()
        .append("g")
        .attr("class", "ring")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    rings.selectAll(".arc")
        .data(d => {
          // console.log(d.r);
          var p = pie(d.data.children);
          p.forEach(e => e["r"]=d.r)
          // console.log(p);
          return p})
        .enter()
        .append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .attr("fill", d => {
          if(d.data.name ==="None"){
            return "white";
          }else{
            return colorMap[d.data.name];
          }
        })//
        .attr("stroke", "white")
        .attr("stroke-width", 0.2)
        .style("opacity", 1)
    // Add a text label to each circle
      var labels = packGroup.selectAll("text")
      .data(hierarchy.descendants().filter(d => d.depth <= 2))
      .enter()
      .append("text")
      .text(d => d.data.name)
      .attr("x", d => d.x)
      .attr("y", d => {
        if (d.depth === 2) {
          return d.y;
        } else {
          return d.y + d.r;
        }
      })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", d => {
        if (d.depth === 0) {
          return "white";
        } else {
          return "black";
        }
      })
      .attr("font-size", d => d.r / 4);
//       .each(function(d) {
//       var label = d3.select(this);
//       var labelLength = label.node().getComputedTextLength();
//       var availableSpace = 2 * d.r - 5; // reduce the available space to make sure the label doesn't touch the edge of the circle
//       if (labelLength > availableSpace) {
//         var text = label.text();
//         var sliceIndex = Math.floor(text.length * availableSpace / labelLength);
//         label.text(text.slice(0, sliceIndex) + "...");
//         var fontSize = d.r / 4;
//         while (label.node().getComputedTextLength() > availableSpace && fontSize > 2) {
//           fontSize--;
//           label.style("font-size", fontSize + "px");
//         }
//       }
//     }
// );
      
    // Create a legend group element
    var legendGroup = svg.append("g")
    .attr("transform", "translate(30, 30)");
    // Create a rectangle and text element for each color in the color map
    var legendItems = legendGroup.selectAll(".legend-item")
    .data(Object.keys(colorMap))
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => "translate(0, " + (i * 25) + ")");

    legendItems.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", d => colorMap[d]);

    legendItems.append("text")
    .attr("x", 30)
    .attr("y", 10)
    .text(d => d)
    .attr("alignment-baseline", "middle");  

    var countGroup = svg.append("g")
    .attr("transform", "translate(50, 800)");
  
    countGroup.append("rect")
      .attr("width", 530)
      .attr("height", 30)
      .attr("fill", "#F0F0F0")
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("transform", "translate(0, -20)");
    
    var count = countGroup.append("text")
      .attr("font-size", "16px")
      .attr("fill", "black")
      .text("");

    packGroup.selectAll(".segment-description")
    .on("click", function(event,d) {
      console.log(d.children[0].data.count)
      count.text("Facebook: " + d.children[0].data.count+ "\nTwitter: " + d.children[3].data.count + "\nSnapchat: " + d.children[2].data.count + "\nInstagram: " + d.children[1].data.count + "\nNone: " + d.children[4].data.count)

    })
    .on("mouseover", function(event,d) {
      d3.select(this)
        .attr("stroke", " orange")
        .attr("stroke-width", 2);
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke", "none")
        .attr("stroke-width", 0);
    });
    
    
    });
   
   
