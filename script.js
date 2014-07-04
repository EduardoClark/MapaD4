var width = 704, height = 480, centered;
var svgMapa, projectionMexico, pathMexico, groupMexico, projectionUsa, pathUsa, groupUsa;
var consulado, mexico, municipio, consulados;
var tooltip = d3.select("body")
.append("div")
.style("position", "absolute")
.style("z-index", "100")
.style("visibility", "hidden");

$(document).ready(function(){
	var anios = $('.anio').on('click', 'a', function(e){
		e.preventDefault();
		anios.removeClass('selected');
		$(this).closest('.anio').addClass('selected');
		d3.json("jsons/consulados"+getAnio()+".json", function(data){
			consulados = data;
			d3.select("#consulados").selectAll("circle")
			.data(consulados, function(d){ return d.key; })
			.style('fill', '#aaa')
			.on("mouseover", tooltipConsulado)
			.exit()
			.style('fill', '#aaa')
			.on("mouseover", function(d){
				tooltip.html(['<div class="hoverinfo text-center">',
					(lang=="es" ? d.name_es : d.name_en),
					'</div>'].join(''));
				return tooltip.style("visibility", "visible");
			});
			if (consulado!=null) { loadMunicipios(consulado); };
			if (municipio!=null) { loadConsulados(municipio); };
		});		
	});

	if (navigator.appVersion.indexOf("MSIE")!=-1) {
		$(".ie-compat").show();
	}
});

svgUsa = d3.select("#mapa").append("svg")
	.attr("width", width)
	.attr("height", 300)
	.attr("id", "svgUsa");

svgMapa = d3.select("#mapa").append("svg")
	.attr("width", width)
	.attr("height", height);

// MEXICO
projectionMexico = d3.geo.mercator()
	.scale(1300)
	.translate([2665, 800]);
pathMexico = d3.geo.path().projection(projectionMexico);
groupMexico = svgMapa.append("g").attr("id", "mexico");

// USA
projectionUsa = d3.geo.albersUsa()
	.scale(600)
	.translate([480,150]);
pathUsa = d3.geo.path().projection(projectionUsa);
groupUsa = svgUsa.append("g").attr("id", "usa");

// DATA
d3.select(".loading").style("visibility", "visible");
d3.json("mx.json", function(mx) {
	groupMexico.append("g")
	.attr("id", "municipios")
	.selectAll("path")
	.data(topojson.feature(mx, mx.objects.municipios2).features, function(d){ d.id = parseInt(d.properties.CVE_ENT + d.properties.CVE_MUN).toString(); return d.id; })
	.enter().append("path")
	.attr("d", pathMexico)
	.on("click.zoom", doZoom)
	.on("click.cons", loadConsulados);

	mexico = groupMexico.selectAll("path").data();

	d3.select(".loading").style("visibility", "hidden");
});

d3.select(".loading").style("visibility", "visible");
d3.json("us.json", function(usa){
	groupUsa.append("g")
	.attr("id", "states")
	.selectAll("path")
	.data(topojson.feature(usa, usa.objects.states).features)
	.enter().append("path")
	.attr("d", pathUsa);

	d3.json("jsons/consulados"+getAnio()+".json", function(data){
		consulados = data;
		groupUsa.append("g")
		.attr("id", "consulados")
		.selectAll("circle")
		.data(consulados, function(d){ return d.key; })
		.enter().append("circle")
		.attr("cx", function(d){ return projectionUsa([d.long, d.lat])[0]; })
		.attr("cy", function(d){ return projectionUsa([d.long, d.lat])[1]; })
		.attr('r', 4)
		.style('cursor', 'pointer')
		.on("click", loadMunicipios)
		.on("mouseover", tooltipConsulado)
		.on("mousemove", tooltipMousemove)
		.on("mouseout", tooltipMouseout);
	});

	d3.select(".loading").style("visibility", "hidden");
});

function tooltipMousemove() {
	return tooltip.style("top", (d3.event.pageY+25)+"px").style("left",(d3.event.pageX+10)+"px");
}

function tooltipMouseout() {
	return tooltip.style("visibility", "hidden");
}

function tooltipConsulado(d) {
	tooltip.html(['<div class="hoverinfo text-center">',
		(lang=="es" ? d.name_es : d.name_en),
		'</br><strong>Total: ' + addCommas(d.total) + '</strong>',
		'</div>'].join(''));
	return tooltip.style("visibility", "visible");
}

function tooltipMunicipio(d) {
	groupMexico.selectAll("path")
	.data(Array(d), function(d){ return d.id; })
	.each(function(d){ 
		data = d3.select(this).property('data-consulado');
		tooltip.html(['<div class="hoverinfo text-center">',
			'<strong>' + data.mun + ',</strong></br>' + data.edo + '</br>',
			'<strong>' + data.value + '</strong>',
			'</div>'].join(''));
	});
	return tooltip.style("visibility", "visible");	
}

function loadMunicipios(d) {
	consulado = d;
	d3.select("#consulado")
	.style("visibility", "visible")
	.text(lang=="es" ? d.name_es : d.name_en);

	d3.select(".loading").style("visibility", "visible");
	d3.json("jsons/"+getAnio()+d.key, function(error, data){
		groupMexico.selectAll("path")
		.data(data, function(d){ return d.id; })
		.property('data-consulado', function(d){ return d; })
		.style('fill', getColor)
		.on("mouseover", tooltipMunicipio)
		.on("mousemove", tooltipMousemove)
		.on("mouseout", tooltipMouseout)
		.exit()
		.style('fill', null)
		.on("mouseover", null);

		groupMexico.selectAll("path").data(mexico, function(d){ return d.id; });

		d3.select(".loading").style("visibility", "hidden");
	});	
}

function loadConsulados(d) {
	municipio = d;
	d3.select(".loading").style("visibility", "visible");
	d3.json("jsons2/"+getAnio()+d.id, function(error, data){
		d3.select("#consulados").selectAll("circle")
		.data(data, function(d){ return d.key; })
		.style('fill', getColor)
		.on("mouseover", function(d){
			tooltip.html(['<div class="hoverinfo text-center">',
				(lang=="es" ? d.name_es : d.name_en) + '</br>',
				'<strong>' + d.value + '</strong></br>',
				'<strong>Total: ' + addCommas(d.total) + '</strong>',
				'</div>'].join(''));
			return tooltip.style("visibility", "visible");
		}).exit()
		.style('fill', '#aaa')
		.on("mouseover", tooltipConsulado);

		d3.select(".loading").style("visibility", "hidden");
	});	
}

// http://bl.ocks.org/mbostock/4060606
function doZoom(d) {
	var x, y, k;
	if (d && centered !== d) {
		var centroid = pathMexico.centroid(d);
		x = centroid[0];
		y = centroid[1];
		k = 5;
		centered = d;
	} else {
		x = width / 2;
		y = height / 2;
		k = 1;
		centered = null;
	}

	groupMexico.selectAll("path")
	.classed("active", centered && function(d) { return d === centered; });

	groupMexico.transition()
	.duration(750)
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	.style("stroke-width", 1.5 / k + "px");
}

function getAnio() {
	return parseInt($('.anio').filter('.selected').find('a').text());
}

function getColor(d) {
	var result = "#000000";
	$.each(colores, function(idx, obj){
		if (obj.min <= d.value && d.value <= obj.max) { result = obj.color; return false; };
	});
	return result;
}

function addCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1;
}

var colores = [
{"color":"#CCCFA7","min":0,"max":0},
{"color":"#ECFE4B","min":1,"max":1},
{"color":"#DEF60B","min":2,"max":2},
{"color":"#D9F008","min":3,"max":3},
{"color":"#D4EB05","min":4,"max":4},
{"color":"#CEE402","min":5,"max":5},
{"color":"#C3DD08","min":6,"max":6},
{"color":"#B1D81E","min":7,"max":7},
{"color":"#A0D431","min":8,"max":8},
{"color":"#8FCF46","min":9,"max":9},
{"color":"#7FCB5A","min":10,"max":10},
{"color":"#6EC76E","min":11,"max":11},
{"color":"#5DC283","min":12,"max":13},
{"color":"#4CBD97","min":14,"max":15},
{"color":"#3BB9AD","min":16,"max":18},
{"color":"#2CB5BF","min":19,"max":23},
{"color":"#27ACB9","min":24,"max":28},
{"color":"#25A3B0","min":29,"max":36},
{"color":"#239AA7","min":37,"max":49},
{"color":"#21929E","min":50,"max":72},
{"color":"#208B97","min":73,"max":134},
{"color":"#1E7B86","min":135,"max":6762}
];

