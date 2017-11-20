
var globalLogLevel = 2;

function Logger(name, loglevel){

    this.name = name || "";
    this.loglevel = loglevel || 2;

    var createAction = function(min, type){
        return function(string){
            if(loglevel <= min){
                console.log("[" + type + "] at " + name + ": " + string);
            }
        };
    };

    this.verbose = createAction(0, "VERBOSE");
    this.trace = createAction(1, "TRACE");
    this.note = createAction(2, "NOTE");
};

var log = new Logger("Global", globalLogLevel );

var intToHexColor = function(n){
    var prefix = "#"
    if(n < 16)
        prefix = "#00"
    else if(n < 256)
        prefix = "#0"

    return prefix+n.toString(16);
}

var createDiv = function(string){
    var newDiv = document.createElement('div');
    newDiv.id = string;
    return newDiv;
}

//control for selecting colors and maintaining color history
function ColorChooser(){
    this.log = new Logger("ColorChooser", globalLogLevel);
    this.log.trace("Creating new ColorChooser");

    this.history = ["#ff0","#0ff","#f0f","#f00"];
    this.pallete_history_div = createDiv("pallete_history");
    this.pallete_div = createDiv("pallete")

    for( i = 0; i < 11; i++){
        var color_row_div = createDiv("color_row");

        for ( j = 0; j < 8; j++){
            var color_div = createDiv("color_swatch_medium");

            var color_num = 4095;
            switch(i){
                case 0: //blue
                    color_num = j * 2;
                    break;
                case 1: //green
                    color_num = j * 32;
                    break;
                case 2: //red
                    color_num = j * 512;
                    break;
                case 3: //yellow
                    color_num = j * 512 + j * 32;
                    break;
                case 4: //magenta
                    color_num = j * 512 + j * 2;
                    break;
                case 5: //cyan
                    color_num = j * 16 + j * 2;
                    break;
                case 6: //violet
                    color_num = j * 256 + j * 16 + j * 2;
                    break;
                case 7: //cyan
                    color_num = j * 256 + j * 32 + j * 2;
                    break;
                case 8: //grays
                    color_num = j * 512 + j * 32 + j * 2;
                    break;
                case 9: //orange
                    color_num = j * 512 + j * 16;
								    break;
								case 10:
                    color_num = j * 512 + j * 8 + j;

            }

            var hc = intToHexColor( color_num );
            color_div.style.backgroundColor=hc;

            color_div.onmouseup = function(c, hex_color){
                return function(event){
                    c.selectColor(hex_color)
                };
            }(this, hc);

            color_row_div.appendChild(color_div);
        }

        this.pallete_div.appendChild(color_row_div);
    }


    for( i in this.history ){
        var color_div = createDiv("color_swatch_large_"+i);
				color_div.className = "color_swatch_large";
        color_div.style.backgroundColor=this.history[i];
				if( i == 0 ){
						color_div.className = "selectedColor";
				}


        color_div.onmouseup = function(c, color_index){
            return function(event){
                c.log.verbose("onmouseup " + color_index);
                c.selectFromHistory(color_index);
            };
        }(this, i);

        this.pallete_history_div.appendChild(color_div);
    }

    document.body.appendChild(this.pallete_div);
    document.body.appendChild(this.pallete_history_div);

}

ColorChooser.prototype.selectColor = function(hex_color){
    this.log.trace("selectColor( " + hex_color + " )");

    for( i in this.history ){
        if( this.history[i] == hex_color){
            this.history[i] = this.history[0];
            this.history.shift();
        }
    }

    this.history.unshift(hex_color);

    for(i in this.pallete_history_div.children){
        if(this.pallete_history_div.children[i].style)
            this.pallete_history_div.children[i].style.backgroundColor = this.history[i];
    }

};

ColorChooser.prototype.selectFromHistory = function(i){
    this.log.trace("selectFromHistory( " + i + " )");
    this.selectColor(this.history[i]);
};

ColorChooser.prototype.currentColor = function(){
    this.log.trace("currentColor() is " + this.history[0] );
    return this.history[0];
};
//end colorchooser

//tools
function SquareTool(size){
		this.name = "SquareTool " + size;
		this.size = size;
};

SquareTool.prototype.action = function(cc, x, y){
		var size = this.size;
		var offset = Math.floor( (size-1) / 2) * -1;
		for( i = offset; i < offset+size; i++ )
				for( j = offset; j < offset+size; j++ ){
						cc.sketch.setPixel( x+i, y+j, cc.pallete.currentColor());
				}
};

SquareTool.prototype.shift_action = function(cc, x, y){
    cc.pallete.selectColor(cc.sketch.getPixel( x, y));
};

SquareTool.prototype.drag_action = function(cc, x, y){
		this.action(cc, x, y);
};


function FillTool(){
		this.name = "FillTool";
};

FillTool.prototype.action = function( cc, x, y ){
		log.trace("Fill action!");
		var img = cc.sketch;
		var fillColor = cc.sketch.getPixel(x, y);
		var newColor = cc.pallete.currentColor();

		if( fillColor != newColor ){

				var fill = function(x, y){
						var pix_col = img.getPixel(x, y);
						log.verbose(pix_col + " " + x + " " + y);
						if( pix_col == null )
								return;

						if( pix_col == fillColor ) {
								img.setPixel(x, y, newColor);

								/*
									//watch draw mode
								setTimeout(function(){
										fill( x + 1, y);
								}, 0);
								setTimeout(function(){
										fill( x, y + 1);
								}, 0);
								setTimeout(function(){
										fill( x - 1, y);
								}, 0);
								setTimeout(function(){
										fill( x, y - 1);
								}, 0);
								cc.draw();
								*/

								//fast fill mode (do not watch draw)
								fill( x + 1, y);
								fill( x, y + 1);
								fill( x - 1, y);
								fill( x, y - 1);

						}
				}
				fill(x, y);
		}

		cc.draw();
};

FillTool.prototype.shift_action = function(cc, x, y){
    cc.pallete.selectColor(cc.sketch.getPixel( x, y));
};

FillTool.prototype.drag_action = function( cc, x, y ){
		log.trace("fill drag");
};

function ReplaceTool(){
		this.name = "Replace Tool";
};

ReplaceTool.prototype.action = function( cc, x, y ){
		var img = cc.sketch;
		var fillColor = cc.sketch.getPixel(x, y);
		var newColor = cc.pallete.currentColor();

		for( i = 0; i < img.width; i++)
				for( j = 0; j < img.height; j++){
						if( img.getPixel(i, j) == fillColor )
								img.setPixel(i, j, newColor);
				}
};

ReplaceTool.prototype.shift_action = function(cc, x, y){
    cc.pallete.selectColor(cc.sketch.getPixel( x, y));
};

ReplaceTool.prototype.drag_action = function( cc, x, y ){
		log.trace("replace drag");
};

//end tools

//tool container
function ToolChooser(){
    this.tools = new Array();
    this.tools.push(new SquareTool(1));
    this.tools.push(new SquareTool(2));
    this.tools.push(new FillTool());
    this.tools.push(new ReplaceTool());

		log.trace("toolbox has " + this.tools.length + " tools");

    this.currentTool = this.tools[0];

		this.tools_div = createDiv("tools");

		for( i in this.tools ){
				var tool_div = createDiv(this.tools[i].name);
				tool_div.className = "tool";
				tool_div.innerHTML = this.tools[i].name;
				
				tool_div.onmouseup = function(tc, n){
						return function(event){
								tc.selectTool(n);
						}
				}(this, i);

				this.tools_div.appendChild(tool_div);
		}

		document.body.appendChild(this.tools_div);

};

ToolChooser.prototype.selectTool = function(n){
		this.currentTool = this.tools[n];
		
		for( i = 0; i < this.tools.length; i++){
				var t_div =	this.tools_div.children[i];
				t_div.className = "tool";
				if( t_div.id == this.currentTool.name ){
						t_div.className = "selectedtool";
				}

		}
};

//image data
function ImageData(w, h){
    this.log = new Logger("ImageData", globalLogLevel);
    this.log.trace("Creating new ImageData( " + w + ", " + h + " )");

    this.width = w;
    this.height = h;
    this.data = this.createSketch(w, h);
}

ImageData.prototype.createSketch = function(width, height){
    var i, j;
    var cntr = 1;

    var c = new Array(height);
    for( i = 0; i < height; i++){
        c[i] = new Array(width);
        for(j = 0 ; j < width; j++){
            c[i][j] = "#xxx";
        }
    }
    return c;
};

ImageData.prototype.setPixel = function( x, y, val ){
    if( x < 0 || x >= this.width || y < 0 || y >= this.height)
        return;

    this.data[y][x] = val;
};

ImageData.prototype.getPixel = function( x, y ){
    if( x < 0 || x >= this.width || y < 0 || y >= this.height)
        return null;

    return this.data[y][x];
}
//end image data

//mouse handler
function CanvasMouseHandler(controller){
    //mouse state
    this.isDragging = false;
    this.last_x = 0;
    this.last_y = 0;
    this.first_x = 0;
    this.first_y = 0;

    this.attach(controller);
};

CanvasMouseHandler.prototype.attach = function(controller){

    var isDragging = this.isDragging;
		var last_x = this.last_x;
		var last_y = this.last_y;
		var first_x = this.first_x;
		var first_y = this.first_y;

    controller.view.onmousedown = function(can_ctrlr){
        return function(event){ 
            last_x = event.clientX;
            last_y = event.clientY;
            first_x = last_x;
            first_y = last_y;
            isDragging = true;  

						can_ctrlr.mousehandler.first_x = first_x;
						can_ctrlr.mousehandler.first_y = first_y;
        };
    }(controller);

    controller.view.onmouseup = function(can_ctrlr){
        return function(event){ 
            var zoom = can_ctrlr.zoom;
            var origin_x = can_ctrlr.origin_x;
            var origin_y = can_ctrlr.origin_y;            
						var tool = can_ctrlr.toolbox.currentTool;

            if(Math.abs(first_x - last_x) < zoom &&
                Math.abs(first_y - last_y) < zoom ){
                var i = Math.floor( (event.clientX - origin_x) / zoom );
                var j = Math.floor( (event.clientY - origin_y) / zoom );

                if(event.shiftKey){
										tool.shift_action(can_ctrlr, i, j);
                } else {
										tool.action(can_ctrlr, i, j);
                }
                can_ctrlr.draw();
            }

            isDragging = false; 
        };
    }(controller);

    controller.view.onmousemove = function(can_ctrlr){
        return function(event){ 
            var control = can_ctrlr.control;
            var img = can_ctrlr.sketch;
            var origin_x = can_ctrlr.origin_x;
            var origin_y = can_ctrlr.origin_y;            
            var pallete = can_ctrlr.pallete;
            var zoom = can_ctrlr.zoom;
						var tool = can_ctrlr.toolbox.currentTool;

            if( isDragging ){
                if(event.shiftKey){
                    can_ctrlr.origin_x += event.clientX - last_x;
                    can_ctrlr.origin_y += event.clientY - last_y;
                } else {
                    var i = Math.floor( (event.clientX - origin_x) / zoom );
                    var j = Math.floor( (event.clientY - origin_y) / zoom );
    
										tool.drag_action(can_ctrlr, i, j);
                }

                last_x = event.clientX;
                last_y = event.clientY;
                
								can_ctrlr.mousehandler.last_x = last_x;
								can_ctrlr.mousehandler.last_y = last_y;

                can_ctrlr.draw();
            }
        };
    }(controller);
};

//end mouse handler

//canvas container
function CanvasController(){
    //canvas element and context, and control (message box)
    this.view = document.getElementById("workspace_view");
    this.context = this.view.getContext("2d");
    this.control = document.getElementById("workspace_ctrl");
		
		this.view.width = window.innerWidth - 168;
		this.view.height = window.innerHeight;

    //canvas background, origin offsets, zoom level
    this.bgColor = "#ccc";
    this.origin_x = 0;
    this.origin_y = 0;
    this.zoom = 10;

    //image to display in workspace
    this.sketch = null;

    //pallete history
    this.pallete = new ColorChooser();

    //tools array
    this.toolbox = new ToolChooser();

    //mouse control
    this.mousehandler = new CanvasMouseHandler(this);

    var pallete = this.pallete;
		var toolbox = this.toolbox;
    var cc = this;
    var keyactions = {
        "97" : function(){ //a
            cc.zoom = cc.zoom + 2;
            cc.origin_x -= cc.sketch.width;
            cc.origin_y -= cc.sketch.height;
        },

        "122" : function(){ //b
            if(cc.zoom > 1){
                cc.zoom = cc.zoom - 2;
                cc.origin_x += cc.sketch.width;
                cc.origin_y += cc.sketch.height;
            }
        },
        "113" : function(){ //q
            pallete.selectFromHistory(1);
        },
        "119" : function(){ //w
            pallete.selectFromHistory(2);
        }, 
        "101" : function(){ //e
            pallete.selectFromHistory(3);
        },
        "114" : function(){ //r
            pallete.selectFromHistory(4);
        },
				"115" : function(){ //s
						if(typeof(Storage) !== undefined && cc.sketch != null){
								console.log("saving");
								localStorage.currentImage = JSON.stringify(cc.sketch.data);
						} else {
								console.log("not saving");
						}
				},
				"49" : function(){ //1
						toolbox.selectTool(0);
				},
				"50" : function(){ //2
						toolbox.selectTool(1);
				},
				"51" : function(){ //3 
						toolbox.selectTool(2);
				},
				"52" : function(){ //4
						toolbox.selectTool(3);
				}
    };

    document.onkeypress = function(event){

        log.note("key pressed " + event.keyCode)
        if(keyactions[event.keyCode]);
            keyactions[event.keyCode]();
        cc.draw();
    };

    this.reset();
};
    
CanvasController.prototype.reset = function(){
    var context = this.context;
    var control = this.control;
    var bgColor = this.bgColor;
    var view = this.view;

    context.fillStyle = bgColor;
    context.fillRect(0, 0, view.width, view.height);

    control.style.width = view.width;
};

CanvasController.prototype.draw = function(){
    var zoom = this.zoom;
    var context = this.context;
    var view = this.view;
    var data = this.sketch.data;

    var tile_w = zoom;
    var tile_h = zoom;
    var x, y;
    //log.note("draw");
    //log.note(context + " " + zoom);
    context.fillStyle = this.bgColor;
    context.fillRect( 0, 0, view.width, view.height);

    for(j in data)
        for(i in data[j]){
            x = i*tile_w + this.origin_x;
            y = j*tile_h + this.origin_y;

								if( data[j][i] == "#xxx" ){
										context.fillStyle = "#888"
										context.fillRect( x, y, tile_w, tile_h );
										context.fillStyle = "#bbb"
										var h_x = tile_w /2;
										var h_y = tile_h /2;
										context.fillRect( x+h_x, y+h_y, h_x, h_y );
										context.fillRect( x, y, h_x, h_y );
								} else {
										if( zoom > 10 ){
												context.fillStyle = "#000";
												context.fillRect( x, y, tile_w, tile_h );
												context.fillStyle = data[j][i];
												context.fillRect( x+1, y+1, tile_w-1, tile_h-1 );
										} else {
												context.fillStyle = data[j][i];
												context.fillRect( x, y, tile_w, tile_h );
										}
								}

            //log.note("drawing to " +x+", "+y+" for pixel "+j+", "+i);
        }

		this.refreshStatus();
};

CanvasController.prototype.attach = function(image){
    this.sketch = image;
};

CanvasController.prototype.refreshStatus = function(){
		this.control.innerHTML = this.mousehandler.last_x + ", " + this.mousehandler.last_y;
		this.control.innerHTML += " (" + this.mousehandler.first_x + ", " + this.mousehandler.first_y + ") ";
		this.control.innerHTML += this.toolbox.currentTool.name + " Selected ; ";
		this.control.innerHTML += "Origin ( " + this.origin_x + ", " + this.origin_y + " )";

};


//end canvas container

var init = function(){
    var workspace = new CanvasController();
		var img = new ImageData(64, 64);

		if( typeof(Storage) !== undefined ){
				if(localStorage.currentImage != null){
						console.log("Using imagedata in localStorage");
						img.data = JSON.parse(localStorage.currentImage);
				} else {
						console.log("Nothing in local storage, generating new blank image");
				}
		}

    workspace.attach(img);
    workspace.draw();
};
