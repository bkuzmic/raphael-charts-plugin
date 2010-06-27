/*
 * Raphael Charts plugin - version 0.1
 * Copyright (c) 2010 Boris Kuzmic (boris.kuzmic@gmail.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 * 
 */

(function () {
    
    Raphael.fn.charts = {
	
	pie3d : function(cx, cy, R1, R2, values, options) {
	    var paper = this;
	    options = options || {};
	    var o = {
		cx: cx / 2,
		cy: cy / 2,
		R1: R1,
		R2: R2,
		val: values,
		len: values.length,
		total: 0,
		colors: options.colors || [],
		dcolors: [],
		size3d: options.size3d || 15,
		animation: options.animation || false,
		explode: options.explode || false		
	    };
	    
	    var slices = [];
	    
	    function Slice() {
		this.s1="";
		this.s2="";
		this.s3="";
		this.top="";
		this.tx=0;
		this.ty=0;
		this.txm=0;
		this.tym=0;
	    };
	    
	    function SlicePart() {
		this.paths = [];
		this.params = [];
		this.indexes = [];
	    };
		
	    // first point in drawing slice
	    var x = o.cx + o.R1;
	    var y = o.cy;	    	    
	    
	    // calculate total and colors
	    Raphael.getColor.reset();	    
	    for (var i=0;i<o.len;i++) {
		o.total += o.val[i];
		if (o.colors[i] == undefined) o.colors[i] = Raphael.getColor(); 
		o.dcolors[i] = calculateDarkColor(o.colors[i]);	
	    }
	    
	    var aTotal = 360 / o.total; // total in scale of degrees
	    var rad = Math.PI / 180;
	    
	    var valSum = 0; // will hold sum of all values
	    	
	    var draw3dBorder = true;
	    var bPart = new SlicePart;
	    var sPart = new SlicePart;	    	   
	    
	    for (var i=0; i<o.len; i++) {				    		    
		attr1 = {stroke: "none", fill: o.dcolors[i]};
		attr2 = {stroke: "none", gradient: "90-" + o.dcolors[i] + "-" + o.colors[i]};
		    
		xa = x;
		ya = y;
		
		valSum += o.val[i];
		alpha = aTotal * valSum;   	
		x = o.cx + o.R1 * Math.cos(alpha * rad);		    		    
		y = o.cy + o.R2 * Math.sin(alpha * rad);
		    
		// calculate translation coordinates for explode effect
		alphaM = aTotal * (valSum - (o.val[i]/2));
		x4 = o.cx + (o.R1/4) * Math.cos(alphaM * rad);
		y4 = o.cy + (o.R2/4) * Math.sin(alphaM * rad);
		xm = o.cx + o.R1 * Math.cos(alphaM * rad);
		ym = o.cy + o.R2 * Math.sin(alphaM * rad);
		    
		s = new Slice;
		    
		p1 = ["M",xa,ya,"L",o.cx, o.cy,"L",o.cx,o.cy+o.size3d,"L",xa,ya+o.size3d,"z"].join(",");
		p2 = ["M",x,y,"L",o.cx, o.cy,"L",o.cx,o.cy+o.size3d,"L",x,y+o.size3d,"z"].join(",");
		
		if (alpha >= 90 && alpha <= 270) {							    
		    d = paper.path(p1);
		    d.attr(attr1);
		    d.toBack();			
		    s.s1 = d;
		} else {
		    if (aTotal * o.val[i] > 90 ) {			
			d = paper.path(p1);
			d.attr(attr1);
			d.toBack();			    
			s.s2 = d;
		    }
		    if (alpha < 90) {			    
			d = paper.path(p2);
			d.attr(attr1);
			s.s1 = d;
		    } else {
			sPart.paths.push(p2);
			sPart.params.push(attr1);
			sPart.indexes.push(i);			
		    }
	        }
		    
		end3dX = x;
		end3dY = y;
					    
		if (alpha >= 180 && draw3dBorder) {				
		    // draw 3d part only up to 180 deegrees and only once
		    end3dX = o.cx - o.R1;
		    end3dY = o.cy;
			
		    p3 =["M",end3dX,end3dY,"A",o.R1,o.R2,"0","0","0",xa,ya,"L",xa,ya + o.size3d,"A",o.R1,o.R2,"0",
			    "0","1",end3dX,end3dY + o.size3d,"L",end3dX,end3dY].join(",");
			
		    d = paper.path(p3);
		    d.attr(attr2);			
		    s.s3 = d;
			
		    draw3dBorder = false;				
	        }
		
		p4 =["M",x,y,"A",o.R1,o.R2,"0",calculateLargeArcFlag(o.val[i], aTotal),"0",xa,ya,"L",xa,ya + o.size3d,
			"A",o.R1,o.R2,"0",calculateLargeArcFlag(o.val[i], aTotal),
			"1",end3dX,end3dY + o.size3d,"L",end3dX,end3dY].join(",");
		    
		if (draw3dBorder && alpha <= 90) {		   			
		    d = paper.path(p4);
		    d.attr(attr2);							    
		    s.s3 = d;			
		} else if(draw3dBorder && alpha > 90) {
		    bPart.paths.push(p4);
		    bPart.params.push(attr2);			
		    bPart.indexes.push(i);
		}
		    
		s.tx = x4;
		s.ty = y4;
		s.txm = xm;
		s.tym = ym;
		slices[i] = s;
	    }				
		
	    for (var i=sPart.paths.length-1;i>=0;i--) {		    
		d = paper.path(sPart.paths[i]);
		d.attr(sPart.params[i]);
		d.toBack();
		s = slices[sPart.indexes[i]];
		s.s1 = d;
		slices[sPart.indexes[i]] = s;
	    }
		
	    for (var i=bPart.paths.length-1;i>=0; i--) {
		d = paper.path(bPart.paths[i]);
		d.attr(bPart.params[i]);		
		s = slices[bPart.indexes[i]];
		s.s3 = d;
		slices[bPart.indexes[i]] = s;
	    }
	    
	    // draw top slices
	    valSum = 0;
	    for (var i=0; i<o.len; i++) {		    
		attr1 = {stroke: "none", fill: o.colors[i]}; // for testing use also "fill-opacity": 0.5 		   	
			
		valSum += o.val[i];
		    
		xa = x;
		ya = y;	
		alpha = aTotal * valSum;		
		x = o.cx + o.R1 * Math.cos(alpha * rad);
		y = o.cy + o.R2 * Math.sin(alpha * rad);
		    
		if (o.val[i] == o.total) {
		    // draw elipse
		    var e = paper.ellipse(pieX, pieY, R1, R2);
		    e.attr(param);
		    break;
	        } else {			
		    p =["M", o.cx, o.cy, "L", x, y,"A",o.R1, o.R2,"0", calculateLargeArcFlag(o.val[i], aTotal), "0", xa, ya, "L", o.cx, o.cy, "z"].join(","); 
		    d = paper.path(p);
		    d.attr(attr1);
		    //p2.toFront();
		    d.node.setAttribute("class","slice");
		    d.node.setAttribute("id", "slice-" + i);
			
		    s = slices[i];
		    s.top = d;
		    slices[i] = s;			
		}		    		    				    
	    }
	    
	    if (o.animation) {
		for (var i=0;i<o.len;i++) {
		    slices[i].top.num = i;
		    slices[i].top.mouseover(function() {
			showTooltip(this.num, true);
			//animateSliceOut(slices[this.num], 1000);
		    }).mouseout(function() {
			showTooltip(this.num, false);
			//animateSliceIn(slices[this.num],500);
		    });
		}
	    }
	    
	    if (o.explode && !o.animation) {
		for (var i=0;i<o.len;i++) {
		    explodeSlice(slices[i]);
		}
	    }
	    
	    function showTooltip(num, show) {
			var tooltip = $("#tooltip");
			if (show) {
			    s = slices[num];
			    v = Math.round((o.val[num] / o.total) * 100) + "%";
			    cur = $(paper.canvas).offset();
			    dirx = o.cx - s.txm;
			    if (dirx < 0) pw = 0;
			    else pw = tooltip.width() + 5;
			    var xt = cur.left + Math.round(o.R1 - dirx) - pw;
			    diry = o.cy - s.tym;
			    if (diry < 0) ph = 0;
			    else ph = tooltip.height() + 5;
			    var yt = cur.top + Math.round(o.R2 - diry) - ph;
			    tooltip.css({left: xt + "px", top: yt + "px", "border-color": s.top.attr('fill')}).html(v).show();
			} else {
			    tooltip.hide();
			}
	    }
	    
	    function animateSliceOut(s, speed) {		
		s.s1.animate({translation: "" + (s.tx - o.cx) + "," + (s.ty - o.cy)}, speed);			    
		if (s.s2) s.s2.animateWith(s.s1,{translation: "" + (s.tx - o.cx) + "," + (s.ty - o.cy)}, speed);
		if (s.s3) {		    
		    s.s3.animateWith(s.s1, {translation: "" + (s.tx - o.cx) + "," + (s.ty - o.cy)}, speed);
		}
		s.top.attr({stroke: "#fff", "stroke-width": 1});
		s.top.animateWith(s.s1, {translation: "" + (s.tx - o.cx) + "," + (s.ty - o.cy)}, speed);		
	    }
	    
	    function animateSliceIn(s, speed) {
		s.s1.stop();
	    	cord = s.s1.attr("translation");
		s.s1.animate({translation: "" + (-cord.x) + "," + (-cord.y)}, speed);	    
		if (s.s2) s.s2.animateWith(s.s1, {translation: "" + (-cord.x) + "," + (-cord.y)}, speed);
		if (s.s3) {
		    s.s3.animateWith(s.s1, {translation: "" + (-cord.x) + "," + (-cord.y)}, speed);
		}
		s.top.attr({stroke: "none"});
		s.top.animateWith(s.s1, {translation: "" + (-cord.x) + "," + (-cord.y)}, speed);	    
	    }
	    
	    function explodeSlice(s) {		
		s.s1.translate(s.tx - o.cx,s.ty - o.cy);
		if (s.s2) s.s2.translate(s.tx - o.cx,s.ty - o.cy);
		if (s.s3) s.s3.translate(s.tx - o.cx,s.ty - o.cy);
		s.top.translate(s.tx - o.cx,s.ty - o.cy);
	    }
	    
	    // helper functions
	    function calculateLargeArcFlag(val, aTotal) {		
		return (aTotal * val) < 180 ? 0 : 1;		
	    }
	    
	    function calculateDarkColor(color) {
		c = Raphael.getRGB(color);
		r = parseInt(c.r) - 66;
		g = parseInt(c.g) - 60;
		b = parseInt(c.b) - 54;
		darkcolor = "#" + toHex(r) + toHex(g) + toHex(b);			    
		return darkcolor;
	    }
	    
	    function toHex(N) {
		if (N==null) return "00";
		N=parseInt(N); if (N==0 || isNaN(N)) return "00";
		N=Math.max(0,N); N=Math.min(N,255); N=Math.round(N);
		return "0123456789ABCDEF".charAt((N-N%16)/16)
			+ "0123456789ABCDEF".charAt(N%16);
	    }	

	},
	
	bar3d : function() {
	    // not yet implemented
	}
	
    };

})();
