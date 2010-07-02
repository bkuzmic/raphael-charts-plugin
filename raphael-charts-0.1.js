/*
 * Raphael Charts plugin - version 0.1
 * Copyright (c) 2010 Boris Kuzmic (boris.kuzmic@gmail.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 * 
 */

(function() {
	Raphael.fn.charts = {
		pie : function(canvasWidth, canvasHeight, R1, R2, values, options) {
			var paper = this;	
			options = options || {};
			var o = {
				cx : canvasWidth / 2,
				cy : canvasHeight / 2,
				R1 : R1,
				R2 : R2,
				val : values,
				numberOfValues : values.length,
				total : 0,
				colors : options.colors || [],
				darkColors : [],
				lightColors: [],
				show3d : options.show3d || false,
				size3d : options.size3d || 15,
				animation : options.animation || false,
				explode : options.explode || false,
				tooltip : options.tooltip || false,
				labels : options.labels || [],
				backgroundFill : options.backgroundFill || [ "#fff", "#fff" ]
			};
	
			var slices = [];
	
			function slice() {
				this.s1 = "";
				this.s2 = "";
				this.s3 = "";
				this.top = "";
				this.tx = 0;
				this.ty = 0;
				this.txm = 0;
				this.tym = 0;
			};
	
			function slicePart() {
				this.paths = [];
				this.params = [];
				this.indexes = [];
			};
			
			calculateTotalAndUsedColors();					
	
			var explodeFactor = 4;						
	
			var aTotal = 360 / o.total; // total in scale of degrees
			var rad = Math.PI / 180;
	
			var valSum = 0; // will hold sum of all values
	
			var draw3dBorder = true;
			var bPart = new slicePart();
			var sPart = new slicePart();
			var topPart = new slicePart();					
			
			// first point in drawing slice
			var x = o.cx + o.R1;
			var y = o.cy;
			
			if (!o.show3d) {
				o.R2 = o.R1;
				explodeFactor = 8;
			}
			
			if (o.numberOfValues == 1) {
				s = new slice();
				// draw elipse
				var e = paper.ellipse(o.cx, o.cy, o.R1, o.R2);
				e.attr({stroke: "none", fill: o.colors[0]});
				s.top = e;
				if (o.show3d) {
					p = createPathForBorderPart(o.cx - o.R1, o.cy, o.cx + o.R1, o.cy, 0);
					borderParams = {stroke : "none", gradient : "90-" + o.darkColors[0] + "-" + o.colors[0]};
					s.s3 = createPart(p, borderParams);
				}					
				slices[0] = s;
			} else {				
				for ( var i = 0; i < o.numberOfValues; i++) {
					s = new slice();
					
					sideParams = {stroke : "none", fill : o.darkColors[i]};
					borderParams = {stroke : "none", gradient : "90-" + o.darkColors[i] + "-" + o.colors[i]};
					topParams = {stroke : "#ccc", fill : o.colors[i]}; 
		
					xa = x;
					ya = y;
		
					valSum += o.val[i];
					alpha = aTotal * valSum;
					
					var largeAngleFlag = calculateLargeArcFlag(o.val[i], aTotal);
					
					x = o.cx + o.R1 * Math.cos(alpha * rad);
					y = o.cy + o.R2 * Math.sin(alpha * rad);
		
					// calculate translation coordinates for explode effect
					alphaM = aTotal * (valSum - (o.val[i] / 2));				
					x4 = o.cx + (o.R1 / explodeFactor) * Math.cos(alphaM * rad);
					y4 = o.cy + (o.R2 / explodeFactor) * Math.sin(alphaM * rad);				
					xm = o.cx + o.R1 * Math.cos(alphaM * rad);
					ym = o.cy + o.R2 * Math.sin(alphaM * rad);
					
					s.tx = x4;
					s.ty = y4;
					s.txm = xm;
					s.tym = ym;
									
					if (o.show3d) {
						topParams.stroke = "none";
						
						p1 = createPathFromPoint(xa,ya);
						p2 = createPathFromPoint(x,y);
		
						if (alpha >= 90 && alpha <= 270) {
							s.s1 = createPartAndSendToBack(p1, sideParams);					
						} else {
							if (alpha > 180 && alpha <= 360) {
								if (aTotal * (valSum - o.val[i]) < 270) {								
									s.s2 = createPartAndSendToBack(p1, sideParams);
								}
							}
							if (alpha < 90) {							
								s.s1 = createPart(p2, sideParams);
							} else {
								sPart.paths.push(p2);
								sPart.params.push(sideParams);
								sPart.indexes.push(i);
							}
						}
						
						// draw 3d border parts only up to 180 deegrees										
						if (alpha >= 180 && draw3dBorder) {										
							p3 = createPathForBorderPart(o.cx - o.R1, o.cy, xa, ya, 0);												
							s.s3 = createPart(p3, borderParams);	
							draw3dBorder = false;
						}
						
						p4 = createPathForBorderPart(x, y, xa, ya, largeAngleFlag);
		
						if (draw3dBorder && alpha <= 90) {						
							s.s3 = createPart(p4, borderParams);
						} else if (draw3dBorder && alpha > 90) {
							bPart.paths.push(p4);
							bPart.params.push(borderParams);
							bPart.indexes.push(i);
						}
					}
					
					// create and prepare top parts, but draw later
					topPath = createPathForTopPart(x, y, xa, ya,largeAngleFlag);
					topPart.paths.push(topPath);
					topPart.params.push(topParams);
					topPart.indexes.push(i);							
							
					slices[i] = s;
				}
				
				drawSlicePart(sPart, "s1");
				drawSlicePart(bPart, "s3");
				drawSlicePart(topPart, "top");
			}						
							
			function drawSlicePart(slicePart, side) {
				for ( var i = slicePart.paths.length - 1; i >= 0; i--) {													
					s = slices[slicePart.indexes[i]];
					if (side == "s1") {
						s[side] = createPartAndSendToBack(slicePart.paths[i], slicePart.params[i]);
					} else {
						s[side] = createPart(slicePart.paths[i], slicePart.params[i]);
					}															
					slices[slicePart.indexes[i]] = s;
				}
			}						
			
			function createPathFromPoint(startX, startY) {
				return ["M", startX, startY, 
				        "L", o.cx, o.cy, 
				        "L", o.cx, o.cy + o.size3d, 
				        "L", startX, startY + o.size3d, "z"].join(",");
			}
			
			function createPathForBorderPart(startX, startY, endX, endY, largeArcFlag) {
				return ["M", startX, startY, 
				        "A", o.R1, o.R2, "0", largeArcFlag, "0", endX, endY, 
				        "L", endX, endY + o.size3d, 
				        "A", o.R1, o.R2, "0", largeArcFlag, "1", startX, startY + o.size3d, 
				        "L", startX, startY, "z" ].join(",");
			}
			
			function createPathForTopPart(startX, startY, endX, endY, largeArcFlag) {
				return ["M", o.cx, o.cy, 
				        "L", startX, startY, 
				        "A", o.R1, o.R2, "0", largeArcFlag, "0", endX, endY, 
				        "L", o.cx, o.cy, "z" ].join(",");
			}
			
			
			function createPartAndSendToBack(path, params) {
				part = createPart(path, params);
				part.toBack();
				return part;
			}
			
			function createPart(path, params) {
				part = paper.path(path);
				part.attr(params);				
				return part;
			}						
			
			// draw background
			var background = paper.rect(0, 0, canvasWidth, canvasHeight);
			var backgroundParams = (o.backgroundFill[0] == o.backgroundFill[1]) ?
					{stroke : "none", fill : o.backgroundFill[0]} : 
					{stroke : "none", gradient : "90-" + o.backgroundFill[0] + "-" + o.backgroundFill[1]}; 			
			background.attr(backgroundParams);			
			background.toBack();
	
			if (o.animation && o.numberOfValues > 1) {
				for ( var i = 0; i < o.numberOfValues; i++) {
					slices[i].top.num = i;
					slices[i].top.mouseover(function() {
						if (o.tooltip)
							showTooltip(this.num, true);
						highlightOn(slices[this.num]);
						animateSliceOut(slices[this.num], 1000);
					}).mouseout(function() {
						if (o.tooltip)
							showTooltip(this.num, false);
						highlightOff(slices[this.num]);
						animateSliceIn(slices[this.num], 500);
					});
				}
			}
	
			if (o.explode && !o.animation) {
				for ( var i = 0; i < o.numberOfValues; i++) {
					explodeSlice(slices[i]);
				}
			}
	
			function showTooltip(num, show) {
				var tooltip = document.getElementById('tooltip');
				if (show) {
					s = slices[num];
					v = Math.round((o.val[num] / o.total) * 100) + "%";
					lbl = o.labels[num] ? o.labels[num] + " - " : "";
					lbl = lbl + v;
	
					cur = findPos(paper.canvas);
	
					// adjust values for left and top position				    
					cur.left = cur.left + o.cx - o.R1;
					cur.top = cur.top + o.cy - o.R2;
	
					wh = findWH(tooltip);
	
					dirx = o.cx - s.txm;
					if (dirx < 0)
						pw = 0;
					else
						pw = wh.width + 5;
					var xt = cur.left + Math.round(o.R1 - dirx) - pw;
					diry = o.cy - s.tym;
					if (diry < 0)
						ph = 0;
					else
						ph = wh.height + 5;
					var yt = cur.top + Math.round(o.R2 - diry) - ph;
	
					var span = tooltip.getElementsByTagName("span")[0];
					span.style.borderColor = s.top.attr('fill');
					span.innerHTML = lbl;
					tooltip.style.left = xt + "px";
					tooltip.style.top = yt + "px";
					tooltip.style.display = 'block';
				} else {
					tooltip.style.display = 'none';
				}
			}
			
			function highlightOn(s) {
				s.top.attr("fill", o.lightColors[s.top.num]);
			}
			
			function highlightOff(s) {
				s.top.attr("fill", o.colors[s.top.num]);
			}
	
			function animateSliceOut(s, speed) {
				var translateX = s.tx - o.cx;
				var translateY = s.ty - o.cy;	
				animateSlice(s, translateX, translateY, speed);					
			}
	
			function animateSliceIn(s, speed) {		
				var animatePart = s.s1 || s.top;
				animatePart.stop();
				var cord = animatePart.attr("translation");				
				animateSlice(s, -cord.x, -cord.y, speed);
			}
			
			function animateSlice(s, xcord, ycord, speed) {								
				if (s.s1) {
					s.s1.animate({translation : "" + xcord + "," + ycord}, speed);
					(s.s2) ? s.s2.animateWith(s.s1, {translation : "" + xcord + "," + ycord}, speed) : false;
					(s.s3) ? s.s3.animateWith(s.s1, {translation : "" + xcord + "," + ycord}, speed) : false;
					s.top.animateWith(s.s1, {translation : "" + xcord + "," + ycord}, speed);
				} else {
					s.top.animate({translation : "" + xcord + "," + ycord}, speed);
				}
			}
	
			function explodeSlice(s) {
				var translateX = s.tx - o.cx;
				var translateY = s.ty - o.cy;
				(s.s1) ? s.s1.translate(translateX, translateY) : false;
				(s.s2) ? s.s2.translate(translateX, translateY) : false;
				(s.s3) ? s.s3.translate(translateX, translateY) : false;
				s.top.translate(translateX, translateY);
			}
				
			function calculateLargeArcFlag(value, total) {
				return (total * value) < 180 ? 0 : 1;
			}
			
			function calculateTotalAndUsedColors() {			
				Raphael.getColor.reset();
				for ( var i = 0; i < o.numberOfValues; i++) {
					o.total += o.val[i];
					(o.colors[i] === undefined) ? o.colors[i] = Raphael.getColor() : false;				
					o.darkColors[i] = calculateDarkColor(o.colors[i]);
					o.lightColors[i] = calculateLightColor(o.colors[i]);
				}
			}			
		},

		bar3d : function(cx, cy, values, options) {
			var paper = this;
			options = options || {};
			var o = {
				val : values,
				numberOfValues : values.length,
				max : 0,
				colors : options.colors || [],
				darkColors : [],
				size3d : options.size3d || -1,
				horizontal : options.horizontal || false,
				tooltip : options.tooltip || false,
				labels : options.labels || [],
				backgroundFill : options.backgroundFill || [ "#fff", "#fff" ]
			};
	
			var bar = []; // holder for interactive part of chart, in this case, front rectangle
	
			// calculate max and colors
			Raphael.getColor.reset();
			for ( var i = 0; i < o.numberOfValues; i++) {
				if (o.val[i] > o.max)
					o.max = o.val[i];
				if (o.colors[i] == undefined)
					o.colors[i] = Raphael.getColor();
				o.darkColors[i] = calculateDarkColor(o.colors[i]);
			}
	
			var padding = 5;
	
			var np = 0; // next point
			var maxp = 0;
			var x = y = w = h = 0;
			var grad_angle = 180;
			if (o.horizontal) {
				grad_angle = 90;
				np = (cy - padding * 2) / o.numberOfValues;
				if (o.size3d == -1)
					o.size3d = np / 4;
				maxp = cx - o.size3d - padding * 3;
				y = padding + o.size3d;
				x = padding;
				h = np / 1.5;
			} else {
				np = (cx - padding * 2) / o.numberOfValues;
				if (o.size3d == -1)
					o.size3d = np / 4;
				maxp = cy - o.size3d - padding * 2;
				x = padding;
				w = np / 1.5;
			}
	
			for ( var i = 0; i < o.numberOfValues; i++) {
				attr1 = {
						stroke : "#000",
						"stroke-width" : 0.5,
						fill : o.colors[i]
				};
				attr2 = {
						stroke : "#000",
						"stroke-width" : 0.5,
						fill : o.darkColors[i]
				};
				attr3 = {
						stroke : "#000",
						"stroke-width" : 0.5,
						gradient : grad_angle + "-" + o.darkColors[i] + "-"
						+ o.colors[i]
				};
	
				if (o.horizontal) {
					w = (maxp / o.max) * o.val[i];
				} else {
					h = (maxp / o.max) * o.val[i];
					y = padding + maxp - h + o.size3d;
				}
	
				r = paper.rect(x, y, w, h);
				r.attr(attr3);
				bar[i] = r;
				bar[i].num = i;
				bar[i].color = o.colors[i];
	
				if (o.tooltip) {
					bar[i].mouseover(function() {
						showTooltip(this.num, true);
					}).mouseout(function() {
						showTooltip(this.num, false);
					});
				}
	
				// draw top path
				p1 = [ "M", x, y, "L", x + o.size3d, y - o.size3d, "L",
				       x + w + o.size3d, y - o.size3d, "L", x + w, y, "z" ]
				.join(",");
				t = paper.path(p1);
				t.attr(attr1);
	
				// draw side
				p2 = [ "M", x + w + o.size3d, y - o.size3d, "L",
				       x + w + o.size3d, y + h - o.size3d, "L", x + w, y + h,
				       "L", x + w, y, "z" ].join(",");
				s = paper.path(p2);
				s.attr(attr2);
	
				if (o.horizontal)
					y += np;
				else
					x += np;
			}
	
			function showTooltip(num, show) {
				var tooltip = document.getElementById('tooltip');
				if (show) {
					b = bar[num];
					lbl = o.labels[num] ? o.labels[num] + " - " : "";
					lbl = lbl + o.val[num];
	
					var span = tooltip.getElementsByTagName("span")[0];
					span.style.borderColor = b.color;
					span.innerHTML = lbl;
	
					cur = findPos(paper.canvas);
	
					wh = findWH(tooltip);
	
					var xt = yt = 0;
					if (o.horizontal) {
						xt = cur.left + b.attr('x') + o.size3d / 2
						+ b.attr('width'); // - (wh.width/2);
						yt = cur.top + b.attr('y') + b.attr('height') / 2
						- wh.height / 2;
					} else {
						xt = cur.left + b.attr('x') + o.size3d / 2
						+ b.attr('width') / 2 - (wh.width / 2);
						yt = cur.top + b.attr('y') - o.size3d / 2 - wh.height;
					}
	
					tooltip.style.left = xt + "px";
					tooltip.style.top = yt + "px";
					tooltip.style.display = 'block';
				} else {
					tooltip.style.display = 'none';
				}
			}
	
			if (o.backgroundFill[0] != o.backgroundFill[1]) {
				// draw grid background
				attrGrid = {
						stroke : "none",
						gradient : "45-" + o.backgroundFill[0] + "-"
						+ o.backgroundFill[1]
				};
				p3 = [ "M", 0, padding + o.size3d, "L", padding + o.size3d, 0,
				       "L", padding + o.size3d, cy - o.size3d - padding, "L",
				       0, cy, "z" ].join(",");
				var grid1 = paper.path(p3);
				grid1.attr(attrGrid);
				grid1.toBack();
	
				p3 = [ "M", padding + o.size3d, 0, "L", cx, 0, "L", cx,
				       cy - o.size3d - padding, "L", padding + o.size3d,
				       cy - o.size3d - padding, "z" ].join(",");
				var grid2 = paper.path(p3);
				grid2.attr(attrGrid);
				grid2.toBack();
	
				p3 = [ "M", padding + o.size3d, cy - o.size3d - padding, "L",
				       cx, cy - o.size3d - padding, "L",
				       cx - padding - o.size3d - 1, cy, "L", 0, cy, "z" ]
				.join(",");
				var grid3 = paper.path(p3);
				grid3.attr(attrGrid);
				grid3.toBack();
			} else {
				// draw plain background
				var background = paper.rect(0, 0, cx, cy);
				background.attr( {
					stroke : "none",
					fill : o.backgroundFill[0]
				});
				background.toBack();
			}
		}
	};

	// ---- helper functions ----        
	function findPos(obj) {
		var curleft = curtop = 0;
		if ("getBoundingClientRect" in document.documentElement	&& !window.opera) {
			var box = obj.getBoundingClientRect();
			var doc = obj.ownerDocument;
			var body = doc.body;
			var docElem = doc.documentElement;
			var clientTop = docElem.clientTop || body.clientTop || 0;
			var clientLeft = docElem.clientLeft || body.clientLeft || 0;

			curtop = box.top + (window.pageYOffset || docElem.scrollTop || body.scrollTop) - clientTop;
			curleft = box.left	+ (window.pageXOffset || docElem.scrollLeft || body.scrollLeft)	- clientLeft;
		} else {
			if (obj.offsetParent) {
				do {
					curleft += obj.offsetLeft;
					curtop += obj.offsetTop;
				} while (obj = obj.offsetParent);
			}
		}
		return {left : curleft,	top : curtop};
	}

	function findWH(obj) {
		var curw = curh = 0;
		// reset css
		obj.style.display = 'block';
		obj.style.visibility = 'hidden';
		// find width and height
		curw = parseInt(obj.offsetWidth);
		curh = parseInt(obj.offsetHeight);
		// restore css
		obj.style.display = 'none';
		obj.style.visibility = '';
		return {width : curw, height : curh};
	}

	function calculateDarkColor(color) {
		var c = Raphael.getRGB(color);
		var r = parseInt(c.r) - 66;
		var g = parseInt(c.g) - 60;
		var b = parseInt(c.b) - 54;
		return "#" + toHex(r) + toHex(g) + toHex(b);		
	}
	
	function calculateLightColor(color) {
		var c = Raphael.getRGB(color);
		var r = parseInt(c.r) + 36;
		var g = parseInt(c.g) + 30;
		var b = parseInt(c.b) + 24;
		return "#" + toHex(r) + toHex(g) + toHex(b);		
	}

	function toHex(N) {
		if (N == null)
			return "00";
		N = parseInt(N);
		if (N == 0 || isNaN(N))
			return "00";
		N = Math.max(0, N);
		N = Math.min(N, 255);
		N = Math.round(N);
		return "0123456789ABCDEF".charAt((N - N % 16) / 16)
			+ "0123456789ABCDEF".charAt(N % 16);
	}

})();
