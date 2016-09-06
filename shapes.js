/**
 * Created by Itai Caspi on 28/07/2016.
 */

var inheritsFrom = function (child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
};

var Line = function(vertices, radius, color, stroke) {
    this.vertices = vertices;
    this.defaultColor = color;
    this.color = color;
    this.borderColor = color;
    this.stroke = (typeof stroke != 'undefined') ? stroke : 1;
    this.radius = (typeof radius != 'undefined') ? radius : 2;
    this.points = 0;
    this.linkStart = [];
    this.linkVertices = [];
    this.linkEnd = [];
    this.endDir = [];
    this.type = "Line";
    this.attachedShapes = [];
};

Line.prototype.attachShape = function(shape) {
    this.attachedShapes.push(shape);
};

Line.prototype.linkedShapeMoved = function(dx, dy, shape) {
    if (shape != "Line") {
        if (this.linkStart == shape) {
            if (this.linkVertices != [] && this.type == "Line" && shape.type == "Line") {
                // the shape is a line
                console.log(this);
                var meanX = (shape.vertices[this.linkVertices[0]].x + shape.vertices[this.linkVertices[1]].x) / 2;
                var meanY = (shape.vertices[this.linkVertices[0]].y + shape.vertices[this.linkVertices[1]].y) / 2;
                this.moveStart(meanX - this.vertices[0].x, meanY - this.vertices[0].y);
            } else {
                this.moveStart(dx, dy);
            }
            for (var i = 0; i < this.attachedShapes.length; i++) {
                this.attachedShapes[i].linkedShapeMoved(dx, dy, this);
            }
        }
        if (this.linkEnd == shape) {
            this.moveEnd(dx, dy);
            for (var i = 0; i < this.attachedShapes.length; i++) {
                this.attachedShapes[i].linkedShapeMoved(dx, dy, this);
            }
        }
    } else {
        console.log("hello");
    }
};

Line.prototype.linkedShapeColorChange = function(shape, arrows) {
    if (this.linkStart == shape) {
        this.color = shape.borderColor;
        this.borderColor = shape.borderColor;
        this.defaultColor = shape.borderColor;
        for (var a = 0; a < arrows.length; a++) {
            arrows[a].linkedShapeColorChange(this, arrows);
        }
    }
};

Line.prototype.startLine = function(start, color, linkStart, linkVertices) {
    this.points++;
    this.vertices[0] = start;
    this.color = color;
    this.borderColor = color;
    this.linkStart = linkStart;
    this.linkVertices = linkVertices;
};

Line.prototype.addPoint = function(point) {
    var lastIdx = this.points-1;
    if (this.points == 1) {
        if (Math.abs(point.x - this.vertices[lastIdx].x) < Math.abs(point.y - this.vertices[lastIdx].y)) {
            this.vertices[this.points] = new Vertex(this.vertices[lastIdx].x, point.y, 0);
        } else {
            this.vertices[this.points] = new Vertex(point.x, this.vertices[lastIdx].y, 0);
        }
    } else if (this.points > 1) {
        if (this.vertices[lastIdx].y == this.vertices[lastIdx-1].y) {
            this.vertices[this.points] = new Vertex(this.vertices[lastIdx].x, point.y, 0);
        } else {
            this.vertices[this.points] = new Vertex(point.x, this.vertices[lastIdx].y, 0);
        }
    }
};

Line.prototype.endLine = function(end, linkEnd) {
    this.linkEnd = linkEnd;
    var lastIdx = this.points-1;
    // close a line
    if (Math.abs(this.vertices[lastIdx].y - end.y) > 3 || Math.abs(this.vertices[lastIdx].x - end.x) > 3) {
        if (this.vertices[lastIdx].y == this.vertices[lastIdx-1].y) {
            this.vertices[lastIdx+1] = new Vertex(this.vertices[lastIdx].x, end.y, 0);
        } else {
            this.vertices[lastIdx+1] = new Vertex(end.x, this.vertices[lastIdx].y, 0);
        }
    } else if (this.points > 2) {
        this.points--;
    }
    this.points = this.vertices.length;
    lastIdx = this.points-1;
    if (this.vertices[lastIdx].y == this.vertices[lastIdx-1].y) {
        this.endDir = "horizontal";
    } else {
        this.endDir = "vertical";
    }
    this.linkEnd = linkEnd;
};


Line.prototype.draw = function(ctx) {

    if (this.vertices.length == 0) return;
    var horizontal, vertical, over, offset;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (var v = 1; v < this.vertices.length; v++) {
        var last = (v == this.vertices.length - 1);
        horizontal = (this.vertices[v].y == this.vertices[v-1].y);
        vertical = (this.vertices[v].x == this.vertices[v-1].x);
        over = (horizontal && this.vertices[v].x >= this.vertices[v-1].x) || (vertical && this.vertices[v].y >= this.vertices[v-1].y);
        offset = (over ? -this.radius : this.radius);
        if (horizontal) {
            if (v > 1) ctx.quadraticCurveTo(this.vertices[v-1].x, this.vertices[v-1].y, this.vertices[v-1].x - offset, this.vertices[v-1].y);
            ctx.lineTo(this.vertices[v].x + (last ? 0 : offset), this.vertices[v].y);
        } else if (vertical) {
            if (v > 1) ctx.quadraticCurveTo(this.vertices[v-1].x, this.vertices[v-1].y, this.vertices[v-1].x, this.vertices[v-1].y - offset);
            ctx.lineTo(this.vertices[v].x, this.vertices[v].y + (last ? offset : offset));
        }
    }

    // draw border
    if (this.stroke > 0) {
        ctx.strokeStyle = this.borderColor.toString();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(this.vertices[this.vertices.length-1].x, this.vertices[this.vertices.length-1].y);
    if (horizontal) {
        ctx.lineTo(this.vertices[this.vertices.length-1].x + offset * 2, this.vertices[this.vertices.length-1].y+5);
        ctx.lineTo(this.vertices[this.vertices.length-1].x + offset * 2, this.vertices[this.vertices.length-1].y-5);
    } else if (vertical) {
        ctx.lineTo(this.vertices[this.vertices.length-1].x+5, this.vertices[this.vertices.length-1].y + offset * 2);
        ctx.lineTo(this.vertices[this.vertices.length-1].x-5, this.vertices[this.vertices.length-1].y + offset * 2);
    }
    ctx.closePath();
    ctx.fillStyle = this.borderColor.toString();
    ctx.fill();

    if (this.linkStart.type == "Line") {
        ctx.beginPath();
        ctx.arc(this.vertices[0].x, this.vertices[0].y, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.borderColor.toString();
        ctx.fill();
    }
};

Line.prototype.moveStart = function(dx, dy) {
    var startDir;
    if (this.endDir == "vertical" && this.points % 2 == 1) startDir = "horizontal";
    else if (this.endDir == "vertical" && this.points % 2 == 0) startDir = "vertical";
    else if (this.endDir == "horizontal" && this.points % 2 == 1) startDir = "vertical";
    else if (this.endDir == "horizontal" && this.points % 2 == 0) startDir = "horizontal";

    if (this.points > 2) {
        if (startDir == "vertical") this.vertices[1].x += dx;
        if (startDir == "horizontal") this.vertices[1].y += dy;
        this.vertices[0].x += dx;
        this.vertices[0].y += dy;
    } else if (this.points == 2) {
        var newVertices = this.vertices;
        var midX, midY;
        if (this.endDir == "horizontal" && dy != 0) {
            midX = (this.vertices[0].x + this.vertices[1].x) / 2;
            newVertices = [this.vertices[0], new Vertex(midX, this.vertices[0].y, 0),
                new Vertex(midX, this.vertices[1].y, 0), this.vertices[1]];
        } else if (this.endDir == "vertical" && dx != 0) {
            midY = (this.vertices[0].y + this.vertices[1].y) / 2;
            newVertices = [this.vertices[0], new Vertex(this.vertices[0].x, midY, 0),
                new Vertex(this.vertices[1].x, midY, 0), this.vertices[1]];
        }
        this.vertices = newVertices;
        this.points = this.vertices.length;
    }
};

Line.prototype.moveEnd = function(dx, dy) {
    var last = this.vertices.length-1;
    if (this.points > 2 || (this.endDir == "horizontal" && dy == 0) || (this.endDir == "vertical" && dx == 0)) {
        if (this.endDir == "vertical") this.vertices[last - 1].x += dx;
        if (this.endDir == "horizontal") this.vertices[last - 1].y += dy;
        this.vertices[last].x += dx;
        this.vertices[last].y += dy;
    } else if (this.points == 2) {
        var newVertices = this.vertices;
        var midX, midY;
        if (this.endDir == "horizontal" && dy != 0) {
            midX = (this.vertices[0].x + this.vertices[1].x) / 2;
            newVertices = [this.vertices[0], new Vertex(midX, this.vertices[0].y, 0),
                new Vertex(midX, this.vertices[1].y, 0), this.vertices[1]];
        } else if (this.endDir == "vertical" && dx != 0) {
            midY = (this.vertices[0].y + this.vertices[1].y) / 2;
            newVertices = [this.vertices[0], new Vertex(this.vertices[0].x, midY, 0),
                new Vertex(this.vertices[1].x, midY, 0), this.vertices[1]];
        }
        this.vertices = newVertices;
        this.points = this.vertices.length;
    }
};

Line.prototype.pointerOnBorder = function(xm, ym, ctx) {
    var relevant = false;
    var pixelColor = ctx.getImageData(xm - this.stroke, ym - this.stroke, this.stroke*2, this.stroke*2).data;
    for (var i = 0; i < 4*this.stroke*this.stroke; i++) {
        if (pixelColor[i*3] == this.borderColor.r && pixelColor[i*3+1] == this.borderColor.g && pixelColor[i*3+2] == this.borderColor.b) {
            relevant = true;
            break;
        }
    }

    if (relevant == false) return false;

    for (var i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        // check between points
        if (((ym <= vi.y + this.stroke && ym >= vj.y) || (ym >= vi.y && ym <= vj.y)) &&
            ((xm <= vi.x && xm >= vj.x) || (xm >= vi.x && xm <= vj.x))) {
            // vertical lines
            if (vi.x == vj.x && (xm <= vi.x + this.stroke) && (xm >= vi.x - this.stroke)) {
                return [i, (i + 1) % this.vertices.length];
            }
            var m = (vj.y - vi.y) / (vj.x - vi.x);
            // other lines
            if ((ym - m*(xm - vi.x) - vi.y <= this.stroke) && (ym - m*(xm - vi.x) - vi.y >= -this.stroke)) {
                return [i, (i + 1) % this.vertices.length];
            }
        }
    }
    return false;
};

//////////////////////////////////
//  Shape


var Shape = function(x, y, width, height, radius, stroke, text, color, borderColor) {
    this.x = x;
    this.xOffset = 0;
    this.y = y;
    this.yOffset = 0;
    this.baseWidth = width;
    this.width = width;
    this.widthOffset = 0;
    this.baseHeight = height;
    this.height = height;
    this.heightOffset = 0;
    this.radius = (typeof radius != 'undefined') ? radius : 2;
    this.stroke = (typeof stroke != 'undefined') ? stroke : 1;
    this.text = (typeof text != 'undefined') ? text : "";
    this.defaultColor = color;
    this.color = color;
    this.borderColor = borderColor;
    this.vertices = [];
    this.shadow = 0;
    this.attachedShapes = [];
};

Shape.prototype.attachShape = function(shape) {
    this.attachedShapes.push(shape);
};

Shape.prototype.updateVertices = function() {
};


Shape.prototype.pointerInside = function(xm, ym) {
    var j = this.vertices.length-1;
    var oddNodes = false;

    for (var i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[j];
        if ((vi.y < ym && vj.y >= ym || vj.y < ym && vi.y >= ym) && (vi.x <= xm || vj.x <= xm)) {
            if (vi.x + (ym - vi.y)/(vj.y-vi.y)*(vj.x - vi.x) < xm) {
                oddNodes = !oddNodes;
            }
        }
        j = i;
    }

    return oddNodes;
};

Shape.prototype.pointerOnBorder = function(xm, ym, ctx) {
    var relevant = false;
    var pixelColor = ctx.getImageData(xm - this.stroke, ym - this.stroke, this.stroke*2, this.stroke*2).data;
    for (var i = 0; i < 4*this.stroke*this.stroke; i++) {
        if (pixelColor[i*3] == this.borderColor.r && pixelColor[i*3+1] == this.borderColor.g && pixelColor[i*3+2] == this.borderColor.b) {
            relevant = true;
            break;
        }
    }

    if (relevant == false) return false;

    for (var i = 0; i < this.vertices.length; i++) {
        var vi = this.vertices[i];
        var vj = this.vertices[(i + 1) % this.vertices.length];
        // check between points
        if (((ym <= vi.y + this.stroke && ym >= vj.y) || (ym >= vi.y - this.stroke && ym <= vj.y + this.stroke)) &&
            ((xm <= vi.x + this.stroke && xm >= vj.x - this.stroke) || (xm >= vi.x - this.stroke && xm <= vj.x + this.stroke))) {
            // vertical lines
            if (vi.x == vj.x && (xm <= vi.x + this.stroke) && (xm >= vi.x - this.stroke)) {
                return true;
            }
            var m = (vj.y - vi.y) / (vj.x - vi.x);
            // other lines
            if ((ym - m*(xm - vi.x) - vi.y <= this.stroke) && (ym - m*(xm - vi.x) - vi.y >= -this.stroke)) {
                return true;
            }
        }
    }
    return false;
};

Shape.prototype.translate = function(dx, dy) {
    for (var i = 0; i < this.vertices.length; i++) {
        this.vertices[i].x += dx;
        this.vertices[i].y += dy;
    }
    this.x += dx;
    this.y += dy;
};

Shape.prototype.updateText = function(text) {
    var textWidth = text.length * 6.5;
    this.text = text;
    if (textWidth > this.baseWidth) {
        this.width = textWidth;
    } else {
        this.width = this.baseWidth;
    }
    this.updateVertices();

};

Shape.prototype.focus = function() {
    if (this.xOffset == 0) {
        this.shadow = 10;
        this.widthOffset = 2;
        this.heightOffset = 2;
        this.width += this.widthOffset;
        this.height += this.heightOffset;
        this.xOffset -= this.widthOffset/2;
        this.yOffset -= this.heightOffset/2;
        this.x += this.xOffset;
        this.y += this.yOffset;
    }
};

Shape.prototype.unfocus = function() {
    this.shadow = 0;
    this.x -= this.xOffset;
    this.y -= this.yOffset;
    this.xOffset = 0;
    this.yOffset = 0;
    this.width -= this.widthOffset;
    this.height -= this.heightOffset;
    this.widthOffset = 0;
    this.heightOffset = 0;
};

/////////////////////////////////////
//  Rectangle

var Rectangle = function(x, y, width, height, radius, offset, stroke, text, color, borderColor) {
    Shape.call(this, x, y, width, height, radius, stroke, text, color, borderColor);
    this.offset = (typeof offset != 'undefined') ? offset : 10;
    this.updateVertices();
    this.type = "Rectangle";
};

inheritsFrom(Rectangle, Shape);

Rectangle.prototype.updateVertices = function() {
    this.vertices = [
        new Vertex(this.x, this.y, 0),
        new Vertex(this.x + this.width, this.y, 0),
        new Vertex(this.x + this.width - this.offset, this.y + this.height, 0),
        new Vertex(this.x - this.offset, this.y + this.height, 0)
    ];
};

Rectangle.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x + this.radius, this.y);
    ctx.lineTo(this.x + this.width - this.radius, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + this.radius);
    ctx.lineTo(this.x + this.width - this.offset, this.y + this.height - this.radius);
    ctx.quadraticCurveTo(this.x + this.width - this.offset, this.y + this.height, this.x + this.width - this.radius - this.offset, this.y + this.height);
    ctx.lineTo(this.x + this.radius - this.offset, this.y + this.height);
    ctx.quadraticCurveTo(this.x - this.offset, this.y + this.height, this.x - this.offset, this.y + this.height - this.radius);
    ctx.lineTo(this.x, this.y + this.radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + this.radius, this.y);
    ctx.closePath();

    // draw border
    if (this.stroke > 0) {
        ctx.shadowBlur = this.shadow;
        ctx.strokeStyle = this.borderColor.toString();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    // draw fill
    ctx.fillStyle = this.color.toString();
    ctx.fill();

    // draw text
    ctx.font="12px Georgia";
    ctx.textAlign="center";
    ctx.fillStyle = "black";
    ctx.shadowBlur = 0;
    ctx.fillText(this.text,this.x+(this.width-this.offset)/2,this.y+this.height/2+3);
};

/////////////////////////////////////
//  Triangle

var Triangle = function(x, y, width, height, radius, stroke, color, borderColor) {
    Shape.call(this, x, y, width, height, radius, stroke, "", color, borderColor);
    this.updateVertices();
    this.type = "Triangle";
};

inheritsFrom(Triangle, Shape);

Triangle.prototype.updateVertices = function() {
    this.vertices = [
        new Vertex(this.x, this.y, 0),
        new Vertex(this.x + this.width, this.y + this.height/2, 0),
        new Vertex(this.x, this.y + this.height, 0)
    ];
};


Triangle.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x + this.radius, this.y);
    ctx.lineTo(this.x + this.width - this.radius, this.y + this.height/2 - this.radius);
    ctx.quadraticCurveTo(this.x + this.width, this.y + this.height/2, this.x + this.width - this.radius, this.y + this.height/2 + this.radius);
    ctx.lineTo(this.x + this.radius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - this.radius);
    ctx.lineTo(this.x, this.y + this.radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + this.radius, this.y);
    ctx.closePath();

    ctx.shadowBlur = this.shadow;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    // draw border
    if (this.stroke > 0) {
        ctx.strokeStyle = this.borderColor.toString();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
    }

    // draw fill
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.color.toString();
    ctx.fill();

};

/////////////////////////////////////
//  Circle

var Circle = function(x, y, radius, stroke, text, color, borderColor) {
    Shape.call(this, x + radius, y + radius, radius, radius, radius, stroke, text, color, borderColor);
    this.vertices = [];
    this.type = "Circle";
};

inheritsFrom(Circle, Shape);

Circle.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);

    ctx.shadowBlur = this.shadow;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    // draw border
    if (this.stroke > 0) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = this.borderColor.toString();
        ctx.lineWidth = this.stroke;
        ctx.stroke();
    }

    // draw fill
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.color.toString();
    ctx.fill();


    // draw text
    ctx.shadowBlur = 0;
    ctx.font="12px Georgia";
    ctx.textAlign="center";
    ctx.fillStyle = "black";
    ctx.fillText(this.text,this.x, this.y + 3);
};

Circle.prototype.pointerInside = function(xm, ym) {
    return (Math.sqrt(Math.pow(xm-this.x, 2) + Math.pow(ym-this.y,2)) < this.radius);
};

Circle.prototype.pointerOnBorder = function(xm, ym, ctx) {
    var relevant = false;
    var pixelColor = ctx.getImageData(xm - this.stroke, ym - this.stroke, this.stroke*2, this.stroke*2).data;
    for (var i = 0; i < 4*this.stroke*this.stroke; i++) {
        if (pixelColor[i*3] == this.borderColor.r && pixelColor[i*3+1] == this.borderColor.g && pixelColor[i*3+2] == this.borderColor.b) {
            relevant = true;
            break;
        }
    }

    if (relevant == false) return false;

    return (Math.sqrt(Math.pow(xm-this.x, 2) + Math.pow(ym-this.y,2)) < this.radius + 3 &&
            Math.sqrt(Math.pow(xm-this.x, 2) + Math.pow(ym-this.y,2)) > this.radius - 3);
};

Circle.prototype.updateText = function(text) {
    var textWidth = text.length * 6.5;
    this.text = text;
    if (textWidth/2 > this.baseWidth) {
        this.radius = textWidth/2;
    } else {
        this.radius = this.baseWidth;
    }
};