// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;

//  Player traits
const LIONS = 1, PACKERS = 2, REF = 3;
const NORMAL = 4, DEF_LINEMAN = 5, OFF_LINEMAN = 6, WR_CB = 7, TE_S_LB = 8, QB = 9, TE = 10;
const UP = vec3(0, 1, 0);
const LEFT = 1, RIGHT = -1;
const gravity = -9.8 / 350000;
const ball_start = .6 / 9;
const ball_horizontal = -33.5 / 600;

function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), 1, 1, 1, 40, "" ) ); }


// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
    ( function init (self)
     {
     self.context = new GL_Context( "gl-canvas" );
     self.context.register_display_object( self );
     
     gl.clearColor( 0, 0, 0, 1 );			// Background color
     
     self.m_cube = new cube();
     self.m_obj = new shape_from_file( "teapot.obj" )
     self.m_axis = new axis();
     self.m_sphere = new sphere( mat4(), 4 );
     self.m_fan = new triangle_fan_full( 10, mat4() );
     self.m_strip = new rectangular_strip( 1, mat4() );
     self.m_cylinder = new cylindrical_strip( 10, mat4() );
     self.m_tetra = new tetrahedron(mat4());
     self.m_lace = new lace(mat4());
     self.fps = 0.0;
     self.eye = vec3(0, 4, 17);
     self.at = vec4(-5.5, -5, -2.5, 1);
     self.qb_transform = mat4();
     self.receiver_transform = mat4();
     self.receiver_left_transform = mat4();
     self.te_transform = mat4();
     self.corner_transform = mat4();
     self.corner_left_transform = mat4();
     self.free_safety_transform = mat4();
     self.strong_safety_transform = mat4();
     self.linebacker_transform = mat4();
     self.linebacker_left_transform = mat4();
     self.off_line_transform = mat4();
     self.def_line_transform = mat4();
     self.ref_transform = mat4();
     self.ball_transform = mat4();
     self.initialized = false;
     self.counter_left = 200;
     self.counter_right = 400;
     self.counter_dl = 500;
     self.leg_move = mat4();
     self.arm_move = mat4();
     self.ball_spinned = false;
     self.jumped = false;
     self.counter_jump = 0;
     
     // 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
     self.graphicsState = new GraphicsState( translate(0, 0,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );
     
     gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
     //self.graphicsState.camera_transform = lookAt(self.eye, self.at, UP);
     self.context.render();
     } ) ( this );
    
    canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}

function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0005 * animation_delta_time;
		var meters_per_frame  = .03 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.graphicsState.camera_transform = mult( rotate( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.graphicsState.camera_transform = mult( translate( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.graphicsState.animation_time += this.animation_delta_time;
		prev_time = time;
        var new_fps = 1000.0 / (this.animation_delta_time ? this.animation_delta_time : 20);
        this.fps = parseInt(((this.fps == 0.0) ? new_fps : 0.11 * new_fps + 0.89 * this.fps) + 0.5);
        this.update_strings(this.context.debug_screen);
        var animation_time = this.graphicsState.animation_time;

		update_camera( this, this.animation_delta_time );
			
		this.basis_id = 0;
		
		var model_transform = mat4();
		
		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), 1, 1, 1, 40 ), // Omit the string parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), 1, 1, .5, 20 ),
        earth = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "earth.gif" ),
        ground = new Material(vec4( .0, .2, .0, 1 ), 1, 1, 1, 40),
			stars = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "stars.png" );
			
		/**********************************
		Start coding here!!!!
		**********************************/
		
        var stack = [];

        if ( ! this.initialized)
        {
            this.initialized = true;
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            model_transform = mult(model_transform, rotate(-90, 0, 1, 0));
            stack.push(model_transform);
            
            var distance = 5.5;
            
            model_transform = mult(model_transform, translate(0, 0, -distance));
            stack.push(model_transform);
            model_transform = mult(model_transform, scale(.1, .1, .1));
            model_transform = mult(model_transform, translate(0, 1, 0));
            model_transform = mult(model_transform, rotate(90, 0, 0, 1));
            this.ball_transform = model_transform;
            this.drawBall(this.ball_transform);
            model_transform = stack.pop();
            stack.push(model_transform);
            
            //  OL
            model_transform = mult(model_transform, translate(-1.5, 0, -0.5));
            this.off_line_transform = model_transform;
            for (var i = 0; i < 5; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, OFF_LINEMAN);
                model_transform = mult(model_transform, translate(0.75, 0, 0));
            }
            
            //  QB
            model_transform = mult(stack[1], translate(0, 0, -2.5));
            this.qb_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, QB);
        
            
            //  Receivers
            model_transform = mult(stack[1], translate(-8, 0, -0.5));
            this.receiver_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(3, 0 ,0));
            }
            model_transform = mult(model_transform, translate(-2, 0, -1));
            this.te_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE_S_LB);
            model_transform = mult(stack[1], translate(8, 0, -0.5));
            this.receiver_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  Defensive Players
            model_transform = mult(stack[1], scale(1, 1, -1));
            stack.push(model_transform);
            model_transform = mult(model_transform, translate(-2, 0, -0.5));
            
            // DL
            this.def_line_transform = model_transform;
            for (var i = 0; i < 3; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, DEF_LINEMAN);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            // Corner
            model_transform = mult(stack[2], translate(-8, 0, -0.5));
            this.corner_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            model_transform = mult(stack[2], translate(8, 0, -0.5));
            this.corner_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            // Safety
            model_transform = mult(stack[2], translate(0, 0, -9));
            this.strong_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);

            model_transform = mult(stack[2], translate(0, 0, -22));
            this.free_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            
            // Linebacker
            model_transform = mult(stack[2], translate(-8, 0, -9));
            this.linebacker_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            model_transform = mult(stack[2], translate(8, 0, -9));
            this.linebacker_left_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }

        if (animation_time < 8000)
        {
            model_transform = mult( model_transform, rotate( this.graphicsState.animation_time / 20, 0, 1, 0 ) );
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            this.drawBall(mult(stack[0], this.ball_transform));
            
            //  OL
            model_transform = mult(stack[0], this.off_line_transform);
            for (var i = 0; i < 5; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, OFF_LINEMAN);
                model_transform = mult(model_transform, translate(0.75, 0, 0));
            }
            
            //  QB
            model_transform = mult(stack[0], this.qb_transform);
            this.drawNormalPlayer(model_transform, PACKERS, QB);
            
            
            //  Receivers
            model_transform = mult(stack[0], this.receiver_transform);
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(3, 0 ,0));
            }
            this.drawNormalPlayer(mult(stack[0], this.te_transform), PACKERS, TE_S_LB);
            this.drawNormalPlayer(mult(stack[0], this.receiver_left_transform), PACKERS, WR_CB);
            
            //  Defensive Players
            
            // DL
            model_transform = mult(stack[0], this.def_line_transform);
            for (var i = 0; i < 3; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, DEF_LINEMAN);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            // Corner
            this.drawNormalPlayer(mult(stack[0], this.corner_transform), LIONS, WR_CB);
            this.drawNormalPlayer(mult(stack[0], this.corner_left_transform), LIONS, WR_CB);
            
            // Safety
            this.drawNormalPlayer(mult(stack[0], this.strong_safety_transform), LIONS, TE_S_LB);
            this.drawNormalPlayer(mult(stack[0], this.free_safety_transform), LIONS, TE_S_LB);
            
            // Linebacker
            model_transform = mult(stack[0], this.linebacker_transform);
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            model_transform = mult(stack[0], this.linebacker_left_transform);
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
        else if (animation_time < 10000)
        {
            var ball_velocity_z = -0.125;
            var ball_velocity_x = 0.03121;
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            //  Ball
            if (animation_time < 9800)
                this.drawBall(this.ball_transform);
            else
            {
                model_transform = mult(this.ball_transform,
                                       translate(this.animation_delta_time * ball_velocity_x,
                                                 0, this.animation_delta_time * ball_velocity_z));
                this.ball_transform = model_transform;
                this.drawBall(model_transform);
            }
            
            //  OL
            model_transform = mult(stack[0], this.off_line_transform);
            for (var i = 0; i < 5; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, OFF_LINEMAN);
                model_transform = mult(model_transform, translate(0.75, 0, 0));
            }
            
            //  QB
            model_transform = mult(stack[0], this.qb_transform);
            this.drawNormalPlayer(model_transform, PACKERS, QB);
            
            //  Update camera
            this.at = vec4(model_transform[0][3], model_transform[1][3], model_transform[2][3], 1);
            this.graphicsState.camera_transform = lookAt(this.eye, vec3(this.at[0], this.at[1], this.at[2]), UP);
            
            
            //  Receivers
            model_transform = mult(stack[0], this.receiver_transform);
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(3, 0 ,0));
            }
            this.drawNormalPlayer(mult(stack[0], this.te_transform), PACKERS, TE_S_LB);
            this.drawNormalPlayer(mult(stack[0], this.receiver_left_transform), PACKERS, WR_CB);
            
            //  Defensive Players
            
            // DL
            model_transform = mult(stack[0], this.def_line_transform);
            for (var i = 0; i < 3; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, DEF_LINEMAN);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            // Corner
            this.drawNormalPlayer(mult(stack[0], this.corner_transform), LIONS, WR_CB);
            this.drawNormalPlayer(mult(stack[0], this.corner_left_transform), LIONS, WR_CB);
            
            // Safety
            this.drawNormalPlayer(mult(stack[0], this.strong_safety_transform), LIONS, TE_S_LB);
            this.drawNormalPlayer(mult(stack[0], this.free_safety_transform), LIONS, TE_S_LB);
            
            // Linebacker
            model_transform = mult(stack[0], this.linebacker_transform);
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            model_transform = mult(stack[0], this.linebacker_left_transform);
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
        else if (animation_time < 16000)
        {
            var lineman_velocity = 0.001;
            var qb_velocity_1 = -0.001;
            var qb_velocity_2 = 0.0035;
            var qb_velocity_3 = 0.004;
            var wr_cb_velocity = 0.00355;
            var te_velocity = 0.0032;
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            //  OL
            model_transform = mult(stack[0], this.off_line_transform);
            if (animation_time < 11500)
                model_transform = mult(model_transform, translate(0, 0, -lineman_velocity * this.animation_delta_time));
            else if (animation_time < 12000)
                model_transform = mult(model_transform, rotate(-0.18 * this.animation_delta_time, 1, 0, 0));
            this.off_line_transform = model_transform;
            if (animation_time > 12000)
                model_transform = mult(model_transform, translate(0, 0, .1));
            for (var i = 0; i < 5; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, OFF_LINEMAN);
                model_transform = mult(model_transform, translate(0.75, 0, 0));
            }
            
            //  QB
            model_transform = mult(stack[0], this.qb_transform);
            
            if (animation_time < 12000)
                model_transform = mult(model_transform, translate(0, 0, qb_velocity_1 * this.animation_delta_time));
            else if (animation_time < 12200)
            {
                this.counter_left -= this.animation_delta_time;
                model_transform = mult(model_transform, rotate(0.45 * this.animation_delta_time, 0, 1, 0));
            }
            else if (animation_time < 12600)
            {
                if (this.counter_left > 0)
                    model_transform = mult(model_transform, rotate(0.45 * this.counter_left, 0, 1, 0));
                this.counter_left = 0;
                model_transform = mult(model_transform, translate(0, 0, -qb_velocity_1 * this.animation_delta_time));
            }
            else if (animation_time < 13000)
            {
                this.counter_right -= this.animation_delta_time;
                model_transform = mult(model_transform, rotate(0.45 * this.animation_delta_time, 0, 1, 0));
            }
            else if (animation_time < 13400)
            {
                if (this.counter_right > 0)
                    model_transform = mult(model_transform, rotate(0.45 * this.counter_right, 0, 1, 0));
                this.counter_right = 0;
                model_transform = mult(model_transform, translate(0, 0, qb_velocity_2 * this.animation_delta_time));
            }
            else if (animation_time < 15000)
                model_transform = mult(model_transform, translate(0, 0, qb_velocity_3 * this.animation_delta_time));
            else if (animation_time < 15200)
            {
                this.counter_left += this.animation_delta_time;
                model_transform = mult(model_transform, rotate(0.45 * this.animation_delta_time, 0, 1, 0));
            }
            else
            {
                if (this.counter_left < 200)
                    model_transform = mult(model_transform, rotate(0.45 * (200 - this.counter_left), 0, 1, 0));
                this.counter_left = 200;
                model_transform = mult(model_transform, translate(0, 0, -qb_velocity_1 * this.animation_delta_time));
            }
                
            this.qb_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, QB);
            
            //  Update camera
            this.at = vec4(model_transform[0][3], model_transform[1][3], model_transform[2][3], 1);
            this.graphicsState.camera_transform = lookAt(this.eye, vec3(this.at[0], this.at[1], this.at[2]), UP);
            
            //  Receivers
            model_transform = mult(stack[0], this.receiver_transform);
            model_transform = mult(model_transform, translate(0, 0, wr_cb_velocity * this.animation_delta_time));
            this.receiver_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(3, 0 ,0));
            }
            
            model_transform = mult(stack[0], this.receiver_left_transform);
            model_transform = mult(model_transform, translate(0, 0, wr_cb_velocity * this.animation_delta_time));
            this.receiver_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  TE
            model_transform = mult(stack[0], this.te_transform);
            model_transform = mult(model_transform, translate(0, 0, te_velocity * this.animation_delta_time));
            this.te_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE_S_LB);
            
            //  Defensive Players
            
            // DL
            model_transform = mult(stack[0], this.def_line_transform);
            if (animation_time < 12500)
                model_transform = mult(model_transform, translate(0, 0, lineman_velocity * this.animation_delta_time));
            else if (animation_time < 15000)
            {
                this.counter_dl -= this.animation_delta_time;
                model_transform = mult(model_transform, rotate(-0.036 * this.animation_delta_time, 0, 1, 0));
            }
            else
            {
                if (this.counter_dl > 0)
                {
                    model_transform = mult(model_transform, rotate(-0.036 * this.counter_dl, 0, 1, 0));
                    this.counter_dl = 0;
                }
                model_transform = mult(model_transform, translate(0, 0, lineman_velocity * this.animation_delta_time));
            }
            this.def_line_transform = model_transform;
            for (var i = 0; i < 3; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, DEF_LINEMAN);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }

            // Corner
            model_transform = mult(stack[0], this.corner_transform);
            model_transform = mult(model_transform, translate(0, 0, -wr_cb_velocity * this.animation_delta_time));
            this.corner_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            model_transform = mult(stack[0], this.corner_left_transform);
            model_transform = mult(model_transform, translate(0, 0, -wr_cb_velocity * this.animation_delta_time));
            this.corner_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);

            var strong_safety_velocity = -0.0053;
            var free_safety_velocity = -0.0025;
            
            // Safety
            model_transform = mult(stack[0], this.strong_safety_transform);
            model_transform = mult(model_transform, translate(0, 0, strong_safety_velocity * this.animation_delta_time));
            this.strong_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            model_transform = mult(stack[0], this.free_safety_transform);
            model_transform = mult(model_transform, translate(0, 0, free_safety_velocity * this.animation_delta_time));
            this.free_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);

            // Linebacker
            model_transform = mult(stack[0], this.linebacker_transform);
            model_transform = mult(model_transform, translate(0, 0, strong_safety_velocity * this.animation_delta_time));
            this.linebacker_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            model_transform = mult(stack[0], this.linebacker_left_transform);
            model_transform = mult(model_transform, translate(0, 0, strong_safety_velocity * this.animation_delta_time));
            this.linebacker_left_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
        else if (animation_time < 18000)
        {
            var lineman_velocity = 0.0007;
            var qb_velocity_1 = -0.001;
            var qb_velocity_2 = 0.003;
            var wr_cb_velocity = 0.00355;
            var te_velocity = 0.0032;
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            //  OL
            model_transform = mult(stack[0], this.off_line_transform);
            for (var i = 0; i < 5; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, OFF_LINEMAN);
                model_transform = mult(model_transform, translate(0.75, 0, 0));
            }
            
            //  QB
            model_transform = mult(stack[0], this.qb_transform);
            if (animation_time < 16500)
                model_transform = mult(model_transform, rotate(-0.18 * this.animation_delta_time, 0, 1, 0));
            else if (animation_time > 17000 && animation_time < 17500)
                model_transform = mult(model_transform, rotate(0.225 * this.animation_delta_time, 0, 1, 0));

            this.qb_transform = model_transform;
            this.drawQB(model_transform);
            
            //  Ball
            var ball_vertical = ball_start + (animation_time - 17500) * (gravity - animation_time / 3000000000);
            if (animation_time >= 17500)
            {
                if (! this.ball_spinned)
                {
                    this.ball_spinned = true;
                    this.ball_transform = mult(mat4(), scale(.1, .1, .1));
                    this.ball_transform = mult(this.ball_transform, translate(model_transform[0][3], model_transform[1][3], model_transform[2][3]));
                }
                
                this.ball_transform = mult(this.ball_transform, translate(ball_horizontal * this.animation_delta_time,
                                                                          ball_vertical * this.animation_delta_time, 0));
                model_transform = mult(this.ball_transform, rotate(this.graphicsState.animation_time * 30, 1, 0, 0));
                this.drawBall(model_transform);
            }

            //  Update camera
            if (animation_time < 16500)
            {
                this.eye[1] += -0.015 * this.animation_delta_time;
                this.eye[2] += -0.015 * this.animation_delta_time;
            }
            if (animation_time < 17500)
                this.at = vec4(model_transform[0][3], model_transform[1][3], model_transform[2][3], 1);
            else
            {
                this.at = vec4(this.ball_transform[0][3], this.ball_transform[1][3], this.ball_transform[2][3], 1);
                this.eye[1] = 6;
            }
            this.graphicsState.camera_transform = lookAt(this.eye, vec3(this.at[0], this.at[1], this.at[2]), UP);

            //  Receivers
            model_transform = mult(stack[0], this.receiver_transform);
            model_transform = mult(model_transform, translate(0, 0, wr_cb_velocity * this.animation_delta_time));
            this.receiver_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(3, 0 ,0));
            }
            
            model_transform = mult(stack[0], this.receiver_left_transform);
            model_transform = mult(model_transform, translate(0, 0, wr_cb_velocity * this.animation_delta_time));
            this.receiver_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  TE
            model_transform = mult(stack[0], this.te_transform);
            model_transform = mult(model_transform, translate(0, 0, te_velocity * this.animation_delta_time));
            this.te_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE_S_LB);
            
            //  Defensive Players
            
            // DL
            model_transform = mult(stack[0], this.def_line_transform);
            model_transform = mult(model_transform, translate(0, 0, lineman_velocity * this.animation_delta_time));
            this.def_line_transform = model_transform;
            for (var i = 0; i < 3; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, DEF_LINEMAN);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            // Corner
            model_transform = mult(stack[0], this.corner_transform);
            model_transform = mult(model_transform, translate(0, 0, -wr_cb_velocity * this.animation_delta_time));
            this.corner_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            model_transform = mult(stack[0], this.corner_left_transform);
            model_transform = mult(model_transform, translate(0, 0, -wr_cb_velocity * this.animation_delta_time));
            this.corner_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            var strong_safety_velocity = -0.0053;
            var free_safety_velocity = -0.0025;
            
            // Safety
            model_transform = mult(stack[0], this.strong_safety_transform);
            model_transform = mult(model_transform, translate(0, 0, strong_safety_velocity * this.animation_delta_time));
            this.strong_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            model_transform = mult(stack[0], this.free_safety_transform);
            model_transform = mult(model_transform, translate(0, 0, free_safety_velocity * this.animation_delta_time));
            this.free_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            
            // Linebacker
            model_transform = mult(stack[0], this.linebacker_transform);
            model_transform = mult(model_transform, translate(0, 0, strong_safety_velocity * this.animation_delta_time));
            this.linebacker_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(2, 0, 0));
            }
            
            model_transform = mult(stack[0], this.linebacker_left_transform);
            model_transform = mult(model_transform, translate(0, 0, strong_safety_velocity * this.animation_delta_time));
            this.linebacker_left_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
        else if (animation_time < 20000)
        {
            model_transform = mult(model_transform, rotate(this.graphicsState.animation_time / 35, 0, 1, 0));
            model_transform = mult(model_transform, rotate(this.graphicsState.animation_time * 30, 1, 0, 0));
            this.drawBall(model_transform);
        }
        else if (animation_time < 23500)
        {
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            //  Ball
            var ball_vertical = ball_start + (animation_time - 19500) * (gravity - animation_time / 3000000000);
            this.ball_transform = mult(this.ball_transform, translate(ball_horizontal * this.animation_delta_time,
                                                                      ball_vertical * this.animation_delta_time, 0));
            var ball_position = vec3(this.ball_transform[0][3], this.ball_transform[1][3], this.ball_transform[2][3]);
            model_transform = mult(this.ball_transform, rotate(this.graphicsState.animation_time * 30, 1, 0, 0));
            this.drawBall(model_transform);
            
            //  Update camera
            this.at = vec4(ball_position[0], ball_position[1], ball_position[2], 1);
            this.graphicsState.camera_transform = lookAt(this.eye, vec3(this.at[0], this.at[1], this.at[2]), UP);
            
            //  Draw players in the end zone
            
            model_transform = mult(stack.pop(), translate(-30.5 , -9.9 ,0));
            model_transform = mult(model_transform, rotate(90, 0, 1, 0));
            model_transform = mult(model_transform, translate(0.5 * Math.sin(animation_time / 100), 0, 0));
            stack.push(model_transform);

            //  Receivers
            model_transform = mult(stack[0], translate(0.5, 0, -1.5));
            this.receiver_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(-1, 0 ,0));
            }

            model_transform = mult(model_transform, translate(5, 0, -0.5));
            this.receiver_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  TE
            model_transform = mult(stack[0], translate(1.5, 0, 0.5));
            this.te_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE_S_LB);
            
            //  Defensive Players
            
            // Corner
            model_transform = mult(stack[0], translate(0.5, 0, 1));
            this.corner_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            model_transform = mult(stack[0], translate(3.5, 0, 1));
            this.corner_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            // Safety
            model_transform = mult(stack[0], translate(-1.5, 0, -2));
            this.strong_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            model_transform = mult(stack[0], translate(-2, 0, -2.25));
            this.free_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            
            // Linebacker
                                   
            model_transform = mult(stack[0], translate(1, 0, -0.1));
            this.linebacker_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }

                                   
            model_transform = mult(stack[0], translate(5, 0, -1.5));
            this.linebacker_left_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(1, 0, 0));
            }
        }
        else if (animation_time < 24500)
        {
            var angle_change = -0.045;
            this.counter_jump += this.animation_delta_time;
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            //  Receivers
            model_transform = this.receiver_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.receiver_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(-1.5, 0 ,0));
            }
            
            model_transform = this.receiver_left_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.receiver_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  TE
            model_transform = this.te_transform;
            if ( ! this.jumped)
                stack.push(model_transform);
            model_transform = mult(model_transform, rotate(angle_change * this.animation_delta_time, 1, 0, 0));
            this.te_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE_S_LB);
            
            //  Ball
            if ( ! this.jumped)
            {
                model_transform = stack.pop();
                this.jumped = true;
                this.ball_transform = mult(mat4(), translate(model_transform[0][3]+1, model_transform[1][3]+1.5, model_transform[2][3]));
                this.ball_transform = mult(this.ball_transform, scale(.1, .1, .1));
                
                model_transform = this.ball_transform;
                this.eye[0] = model_transform[0][3] + 3;
                this.eye[1] = model_transform[1][3] + 3;
                this.eye[2] = model_transform[2][3] + 3;
                this.at = vec4(model_transform[0][3], model_transform[1][3], model_transform[2][3], 1);
                this.graphicsState.camera_transform = lookAt(this.eye, vec3(this.at[0], this.at[1], this.at[2]), UP);
            }
            this.ball_transform = mult(this.ball_transform, translate(-0.0057 * this.animation_delta_time, -0.001 * this.animation_delta_time, 0));
            model_transform = mult(this.ball_transform, rotate(this.graphicsState.animation_time, 1, 0, 0));
            this.drawBall(model_transform);
            
            //  Defensive Players
            
            // Corner
            model_transform = this.corner_transform;
            model_transform = mult(model_transform, rotate(angle_change * this.animation_delta_time, 1, 0, 0));
            this.corner_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            model_transform = this.corner_left_transform;
            model_transform = mult(model_transform, rotate(angle_change * this.animation_delta_time, 1, 0, 0));
            this.corner_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            // Safety
            model_transform = this.strong_safety_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.strong_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            model_transform = this.free_safety_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.free_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            
            // Linebacker
            
            model_transform = this.linebacker_transform;
            //model_transform = mult(model_transform, rotate(angle_change * this.animation_delta_time, 1, 0, 0));
            this.linebacker_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(1.5, 0, 0));
            }
            
            model_transform = this.linebacker_left_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.linebacker_left_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
        else if (animation_time < 27000)
        {
            var height_change = 0.0003;
            if (this.counter_jump < 1000)
            {
                var angle_change = -0.045;
                var diff = 1000 - this.counter_jump;
                var angle = angle_change * diff;
                this.receiver_transform = mult(this.receiver_transform, rotate(-angle, 1, 0, 0));
                this.receiver_left_transform = mult(this.receiver_left_transform, rotate(-angle, 1, 0, 0));
                this.te_transform = mult(this.te_transform, rotate(angle, 1, 0, 0));
                this.corner_left_transform = mult(this.corner_left_transform, rotate(angle, 1, 0, 0));
                this.corner_transform = mult(this.corner_transform, rotate(angle, 1, 0, 0));
                this.strong_safety_transform = mult(this.strong_safety_transform, rotate(-angle, 1, 0, 0));
                this.linebacker_left_transform = mult(this.linebacker_left_transform, rotate(-angle, 1, 0, 0));
                this.linebacker_left_transform = mult(this.linebacker_left_transform, rotate(-2 * angle, 1, 0, 0));
                this.counter_jump = 1000;
            }
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            //  Receivers
            model_transform = this.receiver_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.receiver_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(-1.5, 0 ,0));
            }
            
            model_transform = this.receiver_left_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.receiver_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  TE
            model_transform = this.te_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.te_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE_S_LB);
            
            //  Ball
            this.ball_transform = mult(this.ball_transform, translate(-0.0057 * this.animation_delta_time, -0.001 * this.animation_delta_time, 0));
            model_transform = mult(this.ball_transform, rotate(this.graphicsState.animation_time / 2, 1, 0, 0));
            this.drawBall(model_transform);
        
            //  Defensive Players
            
            // Corner
            model_transform = this.corner_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.corner_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            model_transform = this.corner_left_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.corner_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            // Safety
            model_transform = this.strong_safety_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.strong_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            model_transform = this.free_safety_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.free_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            
            // Linebacker
            
            model_transform = this.linebacker_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.linebacker_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(1.5, 0, 0));
            }
            
            model_transform = this.linebacker_left_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.linebacker_left_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
        else if (animation_time < 27500)
        {
            var height_change = -0.0006;
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);

            //  Receivers
            model_transform = this.receiver_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.receiver_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(-1.5, 0 ,0));
            }
            
            model_transform = this.receiver_left_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.receiver_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  TE
            model_transform = this.te_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.te_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE);
            
            //  Defensive Players
            
            // Corner
            model_transform = this.corner_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.corner_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            model_transform = this.corner_left_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.corner_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            // Safety
            model_transform = this.strong_safety_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.strong_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            model_transform = this.free_safety_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.free_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            
            // Linebacker
            
            model_transform = this.linebacker_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.linebacker_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(1.5, 0, 0));
            }
            
            model_transform = this.linebacker_left_transform;
            model_transform = mult(model_transform, translate(0, height_change * this.animation_delta_time, 0));
            this.linebacker_left_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
        else if (animation_time < 28000)
        {
            var angle_change = -0.09;
            this.counter_jump += this.animation_delta_time;
            stack.push(model_transform);
            
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            //  Receivers
            model_transform = this.receiver_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.receiver_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(-1.5, 0 ,0));
            }
            
            model_transform = this.receiver_left_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.receiver_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  TE
            model_transform = this.te_transform;
            model_transform = mult(model_transform, rotate(angle_change * this.animation_delta_time, 1, 0, 0));
            this.te_transform = model_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE);
            
            //  Defensive Players
            
            // Corner
            model_transform = this.corner_transform;
            model_transform = mult(model_transform, rotate(angle_change * this.animation_delta_time, 1, 0, 0));
            this.corner_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            model_transform = this.corner_left_transform;
            model_transform = mult(model_transform, rotate(angle_change * this.animation_delta_time, 1, 0, 0));
            this.corner_left_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            // Safety
            model_transform = this.strong_safety_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.strong_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            model_transform = this.free_safety_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.free_safety_transform = model_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            
            // Linebacker
            
            model_transform = this.linebacker_transform;
            model_transform = mult(model_transform, rotate(-2 * angle_change * this.animation_delta_time, 1, 0, 0));
            this.linebacker_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(1.5, 0, 0));
            }
            
            model_transform = this.linebacker_left_transform;
            model_transform = mult(model_transform, rotate(-angle_change * this.animation_delta_time, 1, 0, 0));
            this.linebacker_left_transform = model_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
        else
        {
            if (this.counter_jump < 1500)
            {
                var angle_change = -0.09;
                var diff = 1500 - this.counter_jump;
                var angle = angle_change * diff;
                this.receiver_transform = mult(this.receiver_transform, rotate(-angle, 1, 0, 0));
                this.receiver_left_transform = mult(this.receiver_left_transform, rotate(-angle, 1, 0, 0));
                this.te_transform = mult(this.te_transform, rotate(angle, 1, 0, 0));
                this.corner_left_transform = mult(this.corner_left_transform, rotate(angle, 1, 0, 0));
                this.corner_transform = mult(this.corner_transform, rotate(angle, 1, 0, 0));
                this.strong_safety_transform = mult(this.strong_safety_transform, rotate(-angle, 1, 0, 0));
                this.linebacker_left_transform = mult(this.linebacker_left_transform, rotate(-angle, 1, 0, 0));
                this.linebacker_left_transform = mult(this.linebacker_left_transform, rotate(-2 * angle, 1, 0, 0));
                this.counter_jump = 1500;
            }
            stack.push(model_transform);
            model_transform = mult(model_transform, translate(-5.5, -10, 0));
            this.drawArena(model_transform);
            
            //  Receivers
            model_transform = this.receiver_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
                model_transform = mult(model_transform, translate(-1.5, 0 ,0));
            }
            
            model_transform = this.receiver_left_transform;
            this.drawNormalPlayer(model_transform, PACKERS, WR_CB);
            
            //  TE
            model_transform = this.te_transform;
            this.drawNormalPlayer(model_transform, PACKERS, TE);
            if (animation_time > 29000)
            {
                this.eye[0] = model_transform[0][3] + 15;
                this.eye[1] = model_transform[1][3] + (animation_time < 31000 ? 5 : 10);
                this.eye[2] = model_transform[2][3] + (animation_time < 31000 ? -10 : 10);
            }
            
            //  Defensive Players
            
            // Corner
            model_transform = this.corner_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            model_transform = this.corner_left_transform;
            this.drawNormalPlayer(model_transform, LIONS, WR_CB);
            
            // Safety
            model_transform = this.strong_safety_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            model_transform = this.free_safety_transform;
            this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
            
            // Linebacker
            
            model_transform = this.linebacker_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(1.5, 0, 0));
            }
            
            model_transform = this.linebacker_left_transform;
            for (var i = 0; i < 2; i++)
            {
                this.drawNormalPlayer(model_transform, LIONS, TE_S_LB);
                model_transform = mult(model_transform, translate(-2, 0, 0));
            }
        }
}


Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
    //debug_screen_object.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
    debug_screen_object.string_map["fps"] = "FPS: " + this.fps;
	//debug_screen_object.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
    //debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
    //debug_screen_object.string_map["thrust"] = "Thrust: " + thrust;
}

//  Player

function jersey(team)
{
    switch (team)
    {
        case LIONS:
            var cloths = new Material(vec4( .5,.5,.5,1 ), 1, 0.5, 0, 40, "dt_player.jpg");
            break;
        case PACKERS:
            var cloths = new Material(vec4( .5,.5,.5,1 ), 1, 0.5, 0, 40, "gb_player.jpg");
            break;
        default:
            var cloths = new Material(vec4( .5,.5,.5,1 ), 1, 0.5, 0, 40, "ref.png");
            break;
    }
    return cloths;
}

function helmet(team)
{
    switch (team)
    {
        case LIONS:
            var head = new Material(vec4( 0,0,.61,1 ), 1, 1, 0.5, 40);
            break;
        case PACKERS:
            var head = new Material(vec4( 0.4,0.4,0,1 ), 1, 1, 0.5, 40);
            break;
        default:
            var head = new Material(vec4( .8,.8,.8,1 ), 1, 1, 0.5, 40);
            break;
    }
    return head;
}

function leg(team)
{
    switch (team)
    {
        case LIONS:
            var leg = new Material(vec4( .41,.41,.41,1 ), 1, 1, 0, 40);
            break;
        case PACKERS:
            var leg = new Material(vec4( 0.8,0.8,0,1 ), 1, 1, 0, 40);
            break;
        default:
            var leg = new Material(vec4( .15,.15,.15,1 ), 1, 1, 0, 40);
            break;
    }
    return leg;
}

Animation.prototype.drawLeg = function(model_transform, team, player_position, dir)
{
    var legColor = leg(team);
    var stack = [];

    model_transform = mult(model_transform, scale(0.5, 1, 0.5));
    
    switch (player_position)
    {
        case WR_CB:
        case QB:
            if (this.graphicsState.animation_time < 10000)
            {
                var deg = -dir * 45;
                var deg_low = 0;
                var axis = Math.sqrt(2) * 3;
                var axis2 = axis / 2;
                var firstOrigin = 2.25 * Math.sqrt(2);
                var secondOrigin = 0.75 * Math.sqrt(2);
            }
            else
            {
                var deg = 0;
                var deg_low = 0;
                var axis = 6;
                var axis2 = 3;
                var firstOrigin = 4.5;
                var secondOrigin = 1.5;
            }
            break;
        case OFF_LINEMAN:
        case DEF_LINEMAN:
            var deg = -45;
            var deg_low = -deg;
            var axis = 3 / Math.sqrt(2) + 3;
            var axis2 = 3;
            var firstOrigin = 1.5 / Math.sqrt(2) + 3.5;
            var secondOrigin = 1.5;
            model_transform = mult(model_transform, scale(2, 1, 2));
            model_transform = mult(model_transform, translate(0, 0, 0.5));
            break;
        case NORMAL:
        case TE:
        case TE_S_LB:
        default:
            var deg = 0;
            var deg_low = 0;
            var axis = 6;
            var axis2 = 3;
            var firstOrigin = 4.5;
            var secondOrigin = 1.5;
            model_transform = mult(model_transform, scale(1.5, 1, 1.5));
            break;
    }

    stack.push(model_transform);

    model_transform = mult(model_transform, translate(0, axis, 0));
    if (team == REF)
    {
        if (this.graphicsState.animation_time < 22500 || this.graphicsState.animation_time > 28000)
            model_transform = mult(model_transform, rotate(deg, 1, 0, 0));
        else
        {
            var degree = dir * Math.sin(Math.PI * 0.005 * this.graphicsState.animation_time);
            if (player_position == TE_S_LB)
                model_transform = mult(model_transform, rotate(45 * degree + deg, 1, 0, 0));
            else if (player_position != DEF_LINEMAN && player_position != OFF_LINEMAN)
                model_transform = mult(model_transform, rotate(25 * degree + deg, 1, 0, 0));
            else if (player_position == DEF_LINEMAN || this.graphicsState.animation_time < 12000)
            {
                model_transform = mult(model_transform, rotate(25 * degree, 0, 0, 1));
                model_transform = mult(model_transform, rotate(deg, 1, 0, 0));
            }
        }
            
    }
    else
    {
        if (this.graphicsState.animation_time < 10000 || this.graphicsState.animation_time > 20500)
            model_transform = mult(model_transform, rotate(deg, 1, 0, 0));
        else
        {
            var degree = dir * Math.sin(Math.PI * 0.005 * this.graphicsState.animation_time);
            if (player_position == TE_S_LB)
                model_transform = mult(model_transform, rotate(45 * degree + deg, 1, 0, 0));
            else if (player_position != DEF_LINEMAN && player_position != OFF_LINEMAN)
                model_transform = mult(model_transform, rotate(25 * degree + deg, 1, 0, 0));
            else if (player_position == DEF_LINEMAN || this.graphicsState.animation_time < 12000)
            {
                model_transform = mult(model_transform, rotate(25 * degree, 0, 0, 1));
                model_transform = mult(model_transform, rotate(deg, 1, 0, 0));
            }
        }
    }
    model_transform = mult(model_transform, translate(0, -axis, 0));

    stack.push(model_transform);
    model_transform = mult(model_transform, translate(0, firstOrigin, 0));
    model_transform = mult(model_transform, scale(1, 3, 1));
    this.m_cube.draw(this.graphicsState, model_transform, legColor);

    model_transform = mult(stack.pop(), translate(0, axis2, 0));
    model_transform = mult(model_transform, rotate(deg_low, 1, 0, 0));
    model_transform = mult(model_transform, translate(0, -axis2, 0));
    model_transform = mult(model_transform, translate(0, secondOrigin, 0));
    model_transform = mult(model_transform, scale(1, 3, 1));
    this.m_cube.draw(this.graphicsState, model_transform, legColor);
}

Animation.prototype.drawArm = function(model_transform, player_position, hand)
{
    var skin = new Material(vec4(.94, .82, .81, 1), 1, 0.1, 0, 40);
    var stack = [];
    
    var dir = hand ? LEFT : RIGHT;
    if (this.graphicsState.animation_time > 10000 && this.graphicsState.animation_time < 23500)
    {
        var degree = dir * Math.sin(Math.PI * 0.005 * this.graphicsState.animation_time);
        var range = player_position == DEF_LINEMAN ? 25 : 45;
        if (this.graphicsState.animation_time < 12000 || player_position != OFF_LINEMAN)
            model_transform = mult(model_transform, rotate(range * degree, 1, 0, 0));
    }
    stack.push(model_transform);
    var size = (player_position != WR_CB && player_position != QB) ? 1 : 0.5;
    model_transform = mult(model_transform, scale(size, 1, size));

    model_transform = mult(model_transform, translate(0, -1, 0));
    model_transform = mult(model_transform, scale(1, 2, 1));
    this.m_cube.draw(this.graphicsState, model_transform, skin);
    
    model_transform = mult(stack[0], rotate(90, 1, 0, 0));
    model_transform = mult(model_transform, translate(0, 0.5 + size / 2, 2 + size / 2));
    model_transform = mult(model_transform, scale(size, 1 + size * 2, size));
    this.m_cube.draw(this.graphicsState, model_transform, skin);

    if (player_position == QB && ! hand
        && this.graphicsState.animation_time > 10000 && this.graphicsState.animation_time < 16000)
    {
        model_transform = mult(stack.pop(), translate(0, - 2 - 0.5 * size, 2));
        model_transform = mult(model_transform, rotate(90, 0, 0, 1));
        this.drawBall(model_transform);
    }
}

Animation.prototype.drawNormalPlayer = function(model_transform, team, player_position)
{
    var cloths = jersey(team),
        head   = helmet(team),
        black  = new Material(vec4(0,0,0,1), 1, 1, 1, 40);
    var stack = [];

    model_transform = mult(model_transform, scale(0.1, 0.1, 0.1));
    stack.push(model_transform);
    
    //  Draw Leg
    for (var i = 0; i < 2; i++)
    {
        model_transform = mult(stack[0], translate((i % 2 == 0) ? -1 : 1, 0, 0));
        this.drawLeg(model_transform, team, player_position, ((i % 2 == 0) ? LEFT : RIGHT));
    }
    model_transform = stack.pop();

    switch (player_position)
    {
        case WR_CB:
        case QB:
            var axis = Math.sqrt(2) * 3 - 0.2;
            break;
        case DEF_LINEMAN:
            var axis = 3 / Math.sqrt(2) + 4;
            break;
        case NORMAL:
        case TE:
        case TE_S_LB:
        default:
            var axis = 6;
            break;
    }
    
    //  Draw Body
    model_transform = mult(model_transform, translate(0, axis + 2, 0));
    stack.push(model_transform);
    model_transform = mult(model_transform, scale(3, 4, 1));
    this.m_cube.draw(this.graphicsState, model_transform, cloths);
    
    //  Catch the ball
    if (player_position == TE && team == PACKERS
        && this.graphicsState.animation_time >= 27000)
    {
        model_transform = mult(stack[0], translate(0, -1, 2));
        model_transform = mult(model_transform, rotate(90, 0, 0, 1));
        this.drawBall(model_transform);
    }

    model_transform = mult(stack.pop(), translate(0, 2, 0));
    stack.push(model_transform);
    //  Draw Arm
    for (var i = 0; i < 2; i++)
    {
        model_transform = mult(stack[0], translate((i % 2 == 0) ? -1.75 : 1.75, 0, 0));
        this.drawArm(model_transform, player_position, i);
    }

    //  Draw head
    model_transform = mult(stack.pop(), translate(0, 0.8, 0));
    model_transform = mult(model_transform, scale(.8, .8, .8));
    this.m_sphere.draw(this.graphicsState, model_transform, head);
    model_transform = mult(model_transform, translate(0, .1, .8));
    model_transform = mult(model_transform, scale(.2, .2, .2));
    stack.push(model_transform);
    for (var i = 0; i < 2; i++)
    {
        model_transform = mult(stack[0], translate((i % 2 == 0) ? -1.25 : 1.25, 0, 0));
        this.m_sphere.draw(this.graphicsState, model_transform, black);
    }
}

Animation.prototype.drawRefArm = function(model_transform, hand)
{
    var skin = new Material(vec4(.94, .82, .81, 1), 1, 0.1, 0, 40);
    var stack = [];
    
    var dir = hand ? LEFT : RIGHT;
    var size = 0.5;
    if (this.graphicsState.animation_time <= 22500)
    {
        stack.push(model_transform);
        model_transform = mult(model_transform, scale(size, 1, size));
        
        model_transform = mult(model_transform, translate(0, -1, 0));
        model_transform = mult(model_transform, scale(1, 2, 1));
        this.m_cube.draw(this.graphicsState, model_transform, skin);
        
        model_transform = mult(stack[0], rotate(90, 1, 0, 0));
        model_transform = mult(model_transform, translate(0, 0.5 + size / 2, 2 + size / 2));
        model_transform = mult(model_transform, scale(size, 1 + size * 2, size));
        this.m_cube.draw(this.graphicsState, model_transform, skin);
    }
    else if (this.graphicsState.animation_time > 22500 && this.graphicsState.animation_time < 28000)
    {
        var degree = dir * Math.sin(Math.PI * 0.005 * this.graphicsState.animation_time);
        var range = 45;
        model_transform = mult(model_transform, rotate(range * degree, 1, 0, 0));
        
        stack.push(model_transform);
        model_transform = mult(model_transform, scale(size, 1, size));
        
        model_transform = mult(model_transform, translate(0, -1, 0));
        model_transform = mult(model_transform, scale(1, 2, 1));
        this.m_cube.draw(this.graphicsState, model_transform, skin);
        
        model_transform = mult(stack[0], rotate(90, 1, 0, 0));
        model_transform = mult(model_transform, translate(0, 0.5 + size / 2, 2 + size / 2));
        model_transform = mult(model_transform, scale(size, 1 + size * 2, size));
        this.m_cube.draw(this.graphicsState, model_transform, skin);
    }
    else
    {
        model_transform = mult(model_transform, translate(0, 2.5, 0));
        model_transform = mult(model_transform, scale(size, 5, size));
        this.m_cube.draw(this.graphicsState, model_transform, skin);
    }
}

Animation.prototype.drawRef = function(model_transform)
{
    var cloths = jersey(REF),
    head   = helmet(REF),
    black  = new Material(vec4(0,0,0,1), 1, 1, 1, 40);
    var stack = [];
    
    if (this.graphicsState.animation_time > 22500 && this.graphicsState.animation_time < 26000)
        model_transform = mult(model_transform, translate(0.2 * Math.sin(this.graphicsState.animation_time / 500), 0, 0));
    else if (this.graphicsState.animation_time >= 26000 && this.graphicsState.animation_time < 28000)
        model_transform = mult(model_transform, translate(0, 0, 0.001 * (this.graphicsState.animation_time - 26000)));

    model_transform = mult(model_transform, scale(0.1, 0.1, 0.1));
    
    stack.push(model_transform);
    
    //  Draw Leg
    for (var i = 0; i < 2; i++)
    {
        model_transform = mult(stack[0], translate((i % 2 == 0) ? -1 : 1, 0, 0));
        this.drawLeg(model_transform, REF, TE_S_LB, ((i % 2 == 0) ? LEFT : RIGHT));
    }
    model_transform = stack.pop();
    
    var axis = 6;
    
    //  Draw Body
    model_transform = mult(model_transform, translate(0, axis + 2, 0));
    stack.push(model_transform);
    model_transform = mult(model_transform, scale(3, 4, 1));
    this.m_cube.draw(this.graphicsState, model_transform, cloths);
    
    model_transform = mult(stack.pop(), translate(0, 2, 0));
    stack.push(model_transform);
    //  Draw Arm
    for (var i = 0; i < 2; i++)
    {
        model_transform = mult(stack[0], translate((i % 2 == 0) ? -1.75 : 1.75, 0, 0));
        this.drawRefArm(model_transform, i);
    }
    
    //  Draw head
    model_transform = mult(stack.pop(), translate(0, 0.8, 0));
    model_transform = mult(model_transform, scale(.8, .8, .8));
    this.m_sphere.draw(this.graphicsState, model_transform, head);
    model_transform = mult(model_transform, translate(0, .1, .8));
    model_transform = mult(model_transform, scale(.2, .2, .2));
    stack.push(model_transform);
    for (var i = 0; i < 2; i++)
    {
        model_transform = mult(stack[0], translate((i % 2 == 0) ? -1.25 : 1.25, 0, 0));
        this.m_sphere.draw(this.graphicsState, model_transform, black);
    }
}

Animation.prototype.drawQBArm = function(model_transform, hand)
{
    var skin = new Material(vec4(.94, .82, .81, 1), 1, 0.1, 0, 40);
    var stack = [];
    
    var dir = hand ? LEFT : RIGHT;
        
    stack.push(model_transform);
    var size = 0.5;

    if (this.graphicsState.animation_time > 16000 && this.graphicsState.animation_time < 17500 && dir == RIGHT)
    {
        if (this.graphicsState.animation_time > 17000)
            model_transform = mult(model_transform, rotate(-0.135 * (this.graphicsState.animation_time - 17000), 0, 0, 1));
        model_transform = mult(model_transform, scale(2, size, size));
        model_transform = mult(model_transform, translate(-1, 0, 0));
        this.m_cube.draw(this.graphicsState, model_transform, skin);
        model_transform = mult(model_transform, scale(0.5, 2, 2));
        model_transform = mult(model_transform, translate(-1, 0, 0));
        this.drawBall(model_transform);
    }
    else
    {
        var size = 0.5;
        model_transform = mult(model_transform, scale(size, 1, size));
        
        model_transform = mult(model_transform, translate(0, -1, 0));
        model_transform = mult(model_transform, scale(1, 2, 1));
        this.m_cube.draw(this.graphicsState, model_transform, skin);
        
        model_transform = mult(stack[0], rotate(90, 1, 0, 0));
        model_transform = mult(model_transform, translate(0, 0.5 + size / 2, 2 + size / 2));
        model_transform = mult(model_transform, scale(size, 1 + size * 2, size));
        this.m_cube.draw(this.graphicsState, model_transform, skin);
    }
    if (dir == RIGHT && this.graphicsState.animation_time > 10000 && this.graphicsState.animation_time < 16000)
    {
        model_transform = mult(stack.pop(), translate(0, - 2 - 0.5 * size, 2));
        model_transform = mult(model_transform, rotate(90, 0, 0, 1));
        this.ball_transform = model_transform;
        this.drawBall(model_transform);
    }
}

Animation.prototype.drawQBLeg = function(model_transform, dir)
{
    var legColor = leg(PACKERS);
    var stack = [];
    
    model_transform = mult(model_transform, scale(0.5, 1, 0.5));
    var animation_time = this.graphicsState.animation_time;
    
    if (animation_time < 17000)
    {
        var deg = -dir * 45 + (animation_time < 16950 ? 0 : dir * 0.6 * (animation_time - 16950));
        var deg_low = 0;
        var axis = Math.sqrt(2) * 3;
        var axis2 = axis / 2;
        var firstOrigin = 2.25 * Math.sqrt(2);
        var secondOrigin = 0.75 * Math.sqrt(2);
        
        model_transform = mult(model_transform, translate(0, axis, 0));
        model_transform = mult(model_transform, rotate(deg, 0, 0, 1));
        model_transform = mult(model_transform, translate(0, -axis, 0));
    }
    else if (animation_time < 17500)
    {
        var deg = -dir * 45 + dir * 0.1 * (animation_time - 17000);
        var deg_low = 0;
        var axis = Math.sqrt(2) * 3;
        var axis2 = axis / 2;
        var firstOrigin = 2.25 * Math.sqrt(2);
        var secondOrigin = 0.75 * Math.sqrt(2);
        
        model_transform = mult(model_transform, translate(0, axis, 0));
        model_transform = mult(model_transform, rotate(deg, 0, 0, 1));

        model_transform = mult(model_transform, translate(0, -axis, 0));
    }
    else
    {
        var deg = 0;
        var deg_low = 0;
        var axis = 6;
        var axis2 = 3;
        var firstOrigin = 4.5;
        var secondOrigin = 1.5;
        
        model_transform = mult(model_transform, translate(0, axis, 0));
        model_transform = mult(model_transform, rotate(deg, 1, 0, 0));
        model_transform = mult(model_transform, translate(0, -axis, 0));
    }
    stack.push(model_transform);
    
    stack.push(model_transform);
    model_transform = mult(model_transform, translate(0, firstOrigin, 0));
    model_transform = mult(model_transform, scale(1, 3, 1));
    this.m_cube.draw(this.graphicsState, model_transform, legColor);
    
    model_transform = mult(stack.pop(), translate(0, axis2, 0));
    model_transform = mult(model_transform, rotate(deg_low, 1, 0, 0));
    model_transform = mult(model_transform, translate(0, -axis2, 0));
    model_transform = mult(model_transform, translate(0, secondOrigin, 0));
    model_transform = mult(model_transform, scale(1, 3, 1));
    this.m_cube.draw(this.graphicsState, model_transform, legColor);
}

Animation.prototype.drawQB = function(model_transform)
{
    var cloths = jersey(PACKERS),
    head   = helmet(PACKERS),
    black  = new Material(vec4(0,0,0,1), 1, 1, 1, 40);
    var stack = [];

    model_transform = mult(model_transform, scale(0.1, 0.1, 0.1));
    stack.push(model_transform);
    
    //  Draw Leg
    for (var i = 0; i < 2; i++)
    {
        model_transform = mult(stack[0], translate((i % 2 == 0) ? -1 : 1, 0, 0));
        this.drawQBLeg(model_transform, ((i % 2 == 0) ? LEFT : RIGHT));
    }
    model_transform = stack.pop();

    
    var axis = (this.graphicsState.animation_delta_time < 17000) ? Math.sqrt(2) * 3 - 0.2 : 6;
    
    //  Draw Body
    model_transform = mult(model_transform, translate(0, axis + 2, 0));
    stack.push(model_transform);
    model_transform = mult(model_transform, scale(3, 4, 1));
    this.m_cube.draw(this.graphicsState, model_transform, cloths);
    
    model_transform = mult(stack.pop(), translate(0, 2, 0));
    stack.push(model_transform);
    //  Draw Arm
    for (var i = 0; i < 2; i++)
    {
//        if ( ! i && this.graphicsState.animation_time < 17000)
//            model_transform = mult(model_transform, rotate(90, 1, 0, 0));
//        else
            model_transform = stack[0];
        model_transform = mult(model_transform, translate((i % 2 == 0) ? -1.75 : 1.75, 0, 0));
        this.drawQBArm(model_transform, i);
    }
    
    //  Draw head
    model_transform = mult(stack.pop(), translate(0, 0.8, 0));
    model_transform = mult(model_transform, scale(.8, .8, .8));
    this.m_sphere.draw(this.graphicsState, model_transform, head);
    model_transform = mult(model_transform, translate(0, .1, .8));
    model_transform = mult(model_transform, scale(.2, .2, .2));
    stack.push(model_transform);
    for (var i = 0; i < 2; i++)
    {
        model_transform = mult(stack[0], translate((i % 2 == 0) ? -1.25 : 1.25, 0, 0));
        this.m_sphere.draw(this.graphicsState, model_transform, black);
    }
    return stack[0];
}

//  Football

Animation.prototype.drawLace = function(model_transform)
{
    var laceTexture = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "lace.jpg" );
    this.m_lace.draw(this.graphicsState, model_transform, laceTexture);
}

Animation.prototype.drawLaceLine = function(model_transform, dir)
{
    var stack = [];
    stack.push(model_transform);
    for (var i = 0; i < 8; i++)
    {
        if (i && i % 4 == 0)
        {
            model_transform = stack.pop();
            model_transform = mult(model_transform, scale(1, 1, RIGHT));
        }
        this.drawLace(model_transform);
        model_transform = mult(model_transform, translate(dir, -0.05, 0));
        model_transform = mult(model_transform, rotate(-3.14 * dir, 0, 0, 1));
    }
}

Animation.prototype.drawBall = function(model_transform)
{
    var texture = new Material(vec4( 0.5,0.3,0.3,1 ), 1, 1, 1, 40, "texture.jpg");
    var stack = [];
    
    model_transform = mult(model_transform, scale(.5, .5, .5));
    stack.push(model_transform);
    model_transform = mult(model_transform, scale(2, 1, 1));
    gl.uniform1i(g_addrs.FOOTBALL_loc, true);
    this.m_sphere.draw(this.graphicsState, model_transform, texture);
    gl.uniform1i(g_addrs.FOOTBALL_loc, false);
    model_transform = stack.pop();
    
    stack.push(model_transform);
    model_transform = mult(model_transform, translate(0, 0.95, 0));
    model_transform = mult(model_transform, scale(0.2, 0.2, 0.2));
    stack.push(model_transform);
    
    this.drawLaceLine(model_transform, LEFT);
    this.drawLaceLine(model_transform, RIGHT);
}

//  Ford Stadium

Animation.prototype.drawGoalPost = function(model_transform)
{
    var yello = new Material(vec4( 0.8,0.8,0,1 ), 1, 1, 1, 40),
    column = new Material(vec4( 1,.5,.5,1 ), 1, 1, 1, 40, "downmarker.jpg");
    var stack = [];
    
    model_transform = mult(model_transform, scale(.5, .5, .5));
    model_transform = mult(model_transform, translate(0, 3, 0));
    stack.push(model_transform);
    model_transform = mult(model_transform, scale(1, 6, 1));
    this.m_cube.draw(this.graphicsState, model_transform, column);
    
    model_transform = mult(stack[0], scale(9, 1, 1));
    model_transform = mult(model_transform, translate(0, 3.5, 0));
    this.m_cube.draw(this.graphicsState, model_transform, yello);
    
    model_transform = mult(stack[0], translate(4, 9, 0));
    model_transform = mult(model_transform, scale(1, 12, 1));
    this.m_cube.draw(this.graphicsState, model_transform, yello);
    
    model_transform = mult(stack[0], translate(-4, 9, 0));
    model_transform = mult(model_transform, scale(1, 12, 1));
    this.m_cube.draw(this.graphicsState, model_transform, yello);
}

Animation.prototype.drawDownMarker = function(model_transform)
{
    var markerTexture = new Material(vec4( 1,.5,.5,1 ), 1, 1, 1, 40, "downmarker.jpg"),
    black = new Material(vec4(0.2,0.2,0.2,1), 1, 1, 1, 40);
    var stack = [];
    
    model_transform = mult(model_transform, scale(0.3, 0.3, 0.3));
    model_transform = mult(model_transform, translate(0, 4, 0));
    stack.push(model_transform);
    model_transform = mult( model_transform, scale(1, 2, 0.1));
    model_transform = mult( model_transform, rotate(90, 1, 0, 0 ) );
    
    this.m_lace.draw(this.graphicsState, model_transform, markerTexture);
    model_transform = mult(stack[0], translate(0, 0.25, 0));
    model_transform = mult(model_transform, scale(0.5, 0.5, 0.1));
    this.m_cube.draw(this.graphicsState, model_transform, black);
    
    model_transform = mult(stack[0], translate(0, 1.5, 0));
    model_transform = mult(model_transform, scale(1, 1, 0.1));
    this.m_sphere.draw(this.graphicsState, model_transform, markerTexture);
}

Animation.prototype.drawGround = function(model_transform)
{
    var ground = new Material(vec4( 0.5,0.5,0.5,1 ), 1, 1, 1, 40, "ground.png");
    this.m_cube.draw(this.graphicsState, model_transform, ground);
}

Animation.prototype.drawArena = function(model_transform)
{
    var ground = new Material(vec4( .38, .2, 0.07, 1 ), 1, 1, 0, 30),
        lions  = new Material(vec4( 0.5,0.5,0.5,1 ), 1, 1, 1, 40, "lions.png");
    var stack = [];
    stack.push(model_transform);
    
    model_transform = mult(model_transform, scale(65, 0, 30));
    this.m_cube.draw(this.graphicsState, model_transform, ground);
    
    model_transform = mult( stack[0], translate(0, 0.01, 0));
    model_transform = mult( model_transform, scale(60, 0, 26.5));
    this.drawGround(model_transform);
    model_transform = mult(stack[0], translate(0, 0.02, 0));
    model_transform = mult( model_transform, scale(4, 0, -4));
    this.m_cube.draw(this.graphicsState, model_transform, lions);
    
    model_transform = mult( stack[0], translate(0, 0.01, 0));
    stack.push(model_transform);
    model_transform = mult( model_transform, translate(5.5, 0, 13.25));
    for (var i = 0; i < 4; i++)
    {
        if (i && i % 2 == 0)
        {
            model_transform = stack.pop();
            model_transform = mult( model_transform, translate(5.5, 0, -13.25));
        }
        this.drawDownMarker(model_transform);
        model_transform = mult( model_transform, translate(-5, 0, 0));
    }
    model_transform = mult(stack[0], translate(0, 0.01, 0));
    model_transform = mult(model_transform, rotate(90, 0, 1, 0));
    stack.push(model_transform);
    
    model_transform = mult(model_transform, translate(0, 0, -30.5));
    this.drawGoalPost(model_transform);
    model_transform = mult(model_transform, translate((this.graphicsState.animation_time > 20000), 0, (this.graphicsState.animation_time > 28000 ? 3 : 1)));
    this.drawRef(model_transform);
    model_transform = mult(stack.pop(), translate(0, 0, 30.5));
    this.drawGoalPost(model_transform);
    model_transform = mult(model_transform, scale(1, 1, -1));
    model_transform = mult(model_transform, translate((this.graphicsState.animation_time > 20000), 0, 1));
    this.drawRef(model_transform);
}
