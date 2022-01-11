var fps = 24;
var now;
var then = Date.now();
var interval = 1000/fps;// change this to speed up simulation animation
var delta;
var pi = Math.PI;
var prior_points_to_plot = 1000;
var perc_interior_to_plot = 0.75;
var bckgrnd_clr = [40,40,40];
var water_gap = 1;
var x_scale_factor = 0;
var y_scale_factor = 0;
var n_pi = 1;


// wheel input parameters:
var parms = new Object();

    parms.numsteps = Math.round(parms.T/(1/fps));// num of time steps
    parms.dt = 1/fps;                           // one time step per frame
    parms.w0  = 0.05;                           // init ang velocity
    parms.C0 = 0;                               // axial drag coeff

    parms.Q =  0.027;                           // water in flow rate (kg/s)
    parms.m_max = 0.145;                        // max mass a cell can hold
    parms.tilt = 42*pi/180;                     // tilt from horizontal (radians)
    parms.g = 9.81 * Math.sin(parms.tilt);      // effective gravity (kg-m/s^2
    parms.num_cells = 36;                       // number of cells
    parms.wc = 2*pi/parms.num_cells;            // width of a cell (radians)
    parms.R = 0.229;                            // radius of the wheel (m)
    parms.I0 = 0.17;                            // moment of inertia of empty wheel
    // parms.phi = 2*Math.tan(1/22.9);             
    parms.phi = 0.99*parms.wc/2 ;               // width of the water stream, set as half of arlength of a cell (radians)
    parms.th0 = 0;                              // init position
    parms.th_offset = parms.wc/4 ; 

    parms.w_offset = 0.1;

    parms.tol = Math.pow(10,-6);                // error tolerance for iteration

function init(){
    // initialize data arays
    th0_saved_data = new Array(prior_points_to_plot).fill(0);
    wn0_saved_data = new Array(prior_points_to_plot).fill(0);
    al0_saved_data = new Array(prior_points_to_plot).fill(0);
    counter = 0;

    // read button input, leave as undefined and give an alert if invalid input
    var C0_in = document.getElementById("input--C0").value;
    th_in_exists = !!document.getElementById("input--th0");
    if (th_in_exists){
        var th_in = document.getElementById("input--th0").value;
    }else{
        var th_in = parms.th0;
    }


    if( (C0_in =='' || (th_in =='' && th_in_exists) ) ){
        waterwheel_running = false;
        mn0 = new Array(parms.num_cells).fill(0);
        thn0 = parms.th0;
        wn0 = 0;
        draw_wheel(mn0, thn0, wn0, th0_saved_data, wn0_saved_data, al0_saved_data, 0);
        return;
    }else if (!isNaN(C0_in) && !isNaN(th_in) ){
        parms.C0 = parseFloat(C0_in);
        // no negative friction
        if (parms.C0 < 0){
            parms.C0 = 0;
            document.getElementById('input--C0').value = "0";
        }

        // initialize unknowns
        mn0 = new Array(parms.num_cells).fill(0);
        thn0 = mod(parseFloat(th_in),2*pi);
        wn0 = parms.w0;

        //initialize x-y scaling coefficients for phase space plot
        phase_scale_init();
        n_pi = 1;

        w0 = parms.w0;
        w00 = parms.w0 * 1.1;

        waterwheel_running = true;
        $('#button--pausesim').addClass("useable");
        if ($('#button--pausesim > .fas').hasClass("fa-play")){
            $('#button--pausesim > .fas').toggleClass("fa-play");
            $('#button--pausesim > .fas').toggleClass("fa-pause");
        }
        $('#button--pausesim').prop('title', "pause simulation");
        $('#button--runsim').html('<i class="fas fa-undo"></i>');
        $('#button--runsim').prop('title', "restart simulation");
    }else{
        alert("invalid input");
        waterwheel_running = false;
        return;
    }

    // cancel prior animation if button is pressed again
    if (typeof RAF_ID != 'undefined'){
        cancelAnimationFrame(RAF_ID);
        th0_saved_data = new Array(prior_points_to_plot).fill(0);
        wn0_saved_data = new Array(prior_points_to_plot).fill(0);
        al0_saved_data = new Array(prior_points_to_plot).fill(0);
    }

    move();

}

function move() {

    // break recursive animation if tab is closed
    if( !($(".phys.tab_2").hasClass('open')) ){return;}

    // break recursive animation if user presses pause button
    if ( $('#button--pausesim > .fas').hasClass("fa-play") ){return;}


    if(!isNaN(wn0)){
        RAF_ID = requestAnimationFrame(move);
    }else{
        console.log("wn has exploded! Oh the humanity")
        return;
    }

    now = Date.now();
    delta = now - then;

     
    if (delta > interval) {


        let update0 = advance(mn0, thn0, wn0);
        mn0 = update0.m1;
        thn0 = update0.th1;
        wn0 = update0.w1;

        if(counter > fps){
            th0_saved_data[mod(counter,prior_points_to_plot)] = thn0//mod(thn0,2*pi);
            wn0_saved_data[mod(counter,prior_points_to_plot)] = wn0;
            al0_saved_data[mod(counter,prior_points_to_plot)] = alpha(wn0, thn0, mn0);
        }

        counter++;


        then = now - (delta % interval);

        draw_wheel(mn0, thn0, wn0, th0_saved_data, wn0_saved_data, al0_saved_data, 0);

    }

}


// advance one time step
function advance(mn, thn, wn) {

    var err = 1;
    while (err > parms.tol){

        var f0 = funct(w0, wn, thn, mn);
        var f00 = funct(w00,wn, thn, mn);

        var w1 = w0 - f0 * (w0 - w00)/(f0-f00);
        err = Math.abs(w1-w0);
        w00 = w0;
        w0  = w1;
    }
    if(err==0){w00 = w0*1.1;}

    th1 = thn + parms.dt * w1;
    m1 = vm(mn, '+',  vm(parms.dt, '*', dm(th1,mn)));

    return {
        m1,
        th1,
        w1
    }

}

  // root-finding function for w(t^n+1)
    function funct(wguess_in, wn_in, thn_in, mn_in){

        // guesses for thn1 and mn1
        var thn_guess = thn_in + parms.dt*wguess_in;
        var mn_guess = vm(mn_in, '+', vm(parms.dt, '*', dm(thn_guess, mn_in)));

        return -wguess_in + wn_in + parms.dt * alpha(wguess_in, thn_guess, mn_guess);
    }   

  // time rate of change of ang vel ( = dw/dt)
    function alpha(w_t, th_t, m_t){

        var ths = get_ths_array(th_t);

        var sinth = ths.map(e => Math.sin(e));

        return Math.pow(parms.I0 + Math.pow(parms.R,2) * sum_a(m_t),-1) * (
            -w_t * Math.pow(parms.R,2) * sum_a(dm(th_t, m_t)) +
            parms.g*sum_a(vm(m_t, '*', sinth)) - parms.C0 * w_t
        );

    }

  // Determines percent of flow going into each cell
    function percent(th_t,ths){
    
        var perc = new Array(parms.num_cells).fill(0);
    
        var a = 100;
        var pL = function(x) { return 0.5 + x * Math.sqrt((a-x)*(a+x))/(Math.pow(a,2) * pi) + Math.asin(x/a)/pi;}

        // Determines which cell is in the "interesting range" (n to the left,  n - 1 to the right)
        var n = mod(1-Math.floor(th_t/parms.wc)-1,parms.num_cells);
        if (ths[n] >= (parms.wc + parms.phi)/2) {
            n = mod(n-1,parms.num_cells);
        }
        var n_minus = mod(n-1,parms.num_cells)
    
        if (ths[n] <= (parms.wc - parms.phi)/2 || ths[n] >= (2*pi-(parms.wc - parms.phi)/2)){
            perc[n] = 1;
        }else{
            var th_div = ths[n] - parms.wc/2;
            var lwr = parms.phi/2;
            var upr = 2*pi - parms.phi/2;
    
            if (th_div < pi){
                var xin = ((lwr-th_div)*a)/lwr - a;
            }else{
                var xin = ((th_div-2*pi)*a)/(upr-2*pi);
            }
    
            perc[n] = pL(xin);
            perc[n_minus] = 1-pL(xin);

        }

        return perc;
    }

    // time rate of change of mass in each cell ( = dm/dt)
    function dm(th_t, m_t){
        return vm( vm(parms.Q, '*', overflow(m_t, th_t)), '+', leak(m_t));
    }

    // binary array of fill state of each cell
    // 0 = full, 1 = not full
    function overflow(m_t, th_t){
    
        var ths = get_ths_array(th_t);

        var perc = percent(th_t,ths);

        // indice(s) of cell(s) under water stream AND full
        var full_in = [];
        for (var i = 0; i < perc.length; i++) {
            if (perc[i] >= 0 && m_t[i] >= parms.m_max) full_in.push(i);
        }

        // loop through full cells that are taking in water
        // look for a non-full cell downstream that can take the incoming water
        for (i = 0; i<full_in.length; i++){
            var j = full_in[i]
            if (ths[j] < pi){
                var del = 1;
            }else{
                var del = -1;
            }
            var k = mod((j+del),parms.num_cells);
            var ct = 0;
            while (m_t[k] >= parms.m_max){
                k = mod((k+del),parms.num_cells);
                ct++
                if (ct>parms.num_cells){// if all cells are full no water can enter system
                    return vm(0,'*',perc);
                }
            }
            perc[k] = perc[k] + perc[j];
            perc[j] = 0;
        }


        return perc;

    }



    function leak(m_t){

        var m_leaked = new Array(parms.num_cells).fill(0);

        var m_out = m_leaked.map( function(e,i){
            if (m_t[i] > 0) {
                e = -0.007*(m_t[i] + 0.0888);
            }else{
                e = 0;
            }
            return e;
        });

        return m_out;

    }

    // modulo of an array or scalar
    function mod(n,m){

        if (Array.isArray(n)){
            return n.map(x => ((x % m) + m) % m);
        }else{
            return ((n % m) + m) % m;
        }

    }

    // vector operations
    // operation == '*'  ::  A*B  (A is scalar or vector)
    // operation == '+'  ::  A+B  (A is scalar or vector)
    // operation == '^'  ::  A*B  (A is scalar)
    function vm(A,operation,B){

        if (operation == '*'){
            if (Array.isArray(A)){
                return B.map((e,i) => e * A[i]);
            }else{
                return B.map( e => e * A);
            }
        }else if(operation == '+'){
            if (Array.isArray(A)){
                return B.map((e,i) => e + A[i]);
            }else{
                return B.map(e => e + A);
            }
        }else if(operation == '^'){
            return B.map(e => Math.pow(e,A));
        }else{
            console.log('Error, undefined vector operation')
        }
    };

    function get_ths_array(th_t){

        var ths = mod(
            vm(th_t, '+', 
              vm(parms.wc, '*', 
                Array.from(Array(parms.num_cells).keys())
              )
            ), 2*pi);

        return ths 
    }

    function sum_a(A){

        var sum = 0;
        for (i=0; i<A.length; i++){
            sum = sum + A[i];
        }

        return sum;
    }



// draw a frame
function draw_wheel(mn, thn, wn, thn_saved_data, wn_saved_data, al_saved_data, canvas_ID) {

    canvas = document.getElementsByTagName('canvas');
    l = canvas[canvas_ID].getContext('2d');


    // for (var i=1; i<=canvas.length; i++){
    //     console.log($('.canvas_'+i.toString()).width());

    //     canvas[i-1].width = $('.canvas_'+i.toString()).width();
    //     canvas[i-1].height = $('.canvas_'+i.toString()).height();
    // }

    console.log($('.canvases').width());

    canvas[0].width = $('.canvases').width();
    canvas[1].width = $('.canvases').width();
    canvas[0].height = 0.8 * $('.canvases').height();
    canvas[1].height = 0.2 * $('.canvases').height();


    var bckgrnd =  "rgb("+bckgrnd_clr[0]+","+bckgrnd_clr[1]+","+bckgrnd_clr[2]+")";
    var lr_color = ["rgb(104, 151, 117)","rgb(184,187,37)"];
    l.fillStyle = bckgrnd;

    lw_matlab = 2*parms.R*1.27;
    var theta_offset = pi/2;

    // clear the specified pixels within the given rectangle
    // l.clearRect(0, 0, canvas[0].offsetWidth, canvas[0].offsetHeight);


    // draw a phase space plot in the center
    // plotting line color
    var red = [255,bckgrnd_clr[0]];
    var gre = [95,bckgrnd_clr[1]];
    var blu = [31,bckgrnd_clr[2]];
    var shade = function(clr_in, p) {return (clr_in[1]-clr_in[0])*p + clr_in[0]; };
    var oldest_i = mod(counter+1,prior_points_to_plot)
    var x_pt = wx_scale(wn_saved_data[oldest_i]);
    var y_pt = ay_scale(al_saved_data[oldest_i]);
    for (i=1; i<prior_points_to_plot-1; i++){
        l.beginPath();
        l.moveTo(x_pt, y_pt);

        var j = mod(i+oldest_i,prior_points_to_plot);
        x_pt = wx_scale(wn_saved_data[j]);
        y_pt = ay_scale(al_saved_data[j]);

        l.lineTo(x_pt, y_pt);
        // var shade = 255 * (1-i/(prior_points_to_plot-1));
        var p = 1-i/(prior_points_to_plot-1);
        l.strokeStyle = "rgb("+String(shade(red,p))+","+String(shade(gre,p))+","+String(shade(blu,p))+")";
        l.lineWidth = 1.5;
        l.stroke();
    }

    // draw a ring to hide any phase space overflow
    l.beginPath();
    l.arc(px(0),py(0), sx(2*parms.R),0,2*pi,false);
    l.lineWidth = sx( 2*parms.R*(1+parms.wc/2) + 2*parms.R*(1-parms.wc/2)*(1-perc_interior_to_plot) );
    l.strokeStyle = '#FBFAF5';
    l.stroke();

    // draw wheel cells
    for (i = 0; i<parms.num_cells; i++){
        var theta = thn + theta_offset;
        var R11 = Math.cos(theta);
        var R12 = -Math.sin(theta);
        var R21 = Math.sin(theta);
        var R22 = Math.cos(theta);

        var x = parms.R * Math.cos( (2*i)*pi/parms.num_cells );
        var y = parms.R * Math.sin( (2*i)*pi/parms.num_cells );

        var x_rot = R11*x + R12*y;
        var y_rot = R21*x + R22*y;

        // empty circle
        l.beginPath();
        l.strokeStyle = bckgrnd;
        l.lineWidth = 1;
        l.arc(px(x_rot), py(y_rot), sx(parms.wc*parms.R/2), 0, pi * 2, false);
        if (i==0){
            l.fillStyle = lr_color[canvas_ID];
            l.fill();
        }
        l.stroke();

        l.beginPath();
        var perc_full = mn[i]/parms.m_max;
        if (perc_full<0){perc_full = 0;}
        l.fillStyle = "#647ecd";
        l.strokeStyle = bckgrnd;
        l.lineWidth = 1;
        l.arc(px(x_rot), py(y_rot), sx(parms.wc*parms.R/2), (90-180*perc_full)*pi/180, (90+180*perc_full)*pi/180, false);
        l.fill();
        l.stroke();
    }



  // draw water inlet
    var base_y = parms.R+0.002;
    var seconds_per_gap = 2;
    var p = 1 - mod(counter-fps/2,seconds_per_gap*fps)/(seconds_per_gap*fps);
    var H = 0.0225;
    var g = 0.0025;
    var h1 = p*H-g/2;
    var y2 = h1 + g;
    var h2 = (1-p)*H - g/2;
    if (h1<0){h1 = 0;}
    if (h2<0){h2 = 0;}
    if (counter > fps/2){
        l.fillStyle = "#647ecd";
        l.fillRect(px(-(parms.phi*parms.R)/2), py(base_y), sx(parms.phi*parms.R), sy(h1));

        l.fillStyle = "#647ecd";
        l.fillRect(px(-(parms.phi*parms.R)/2), py(base_y+y2), sx(parms.phi*parms.R), sy(h2));

    }
    l.drawImage(document.getElementById('faucet'), px(-0.075), py(base_y+H-0.011),sx(0.085), sy(0.085));

    // draw theta data
    var maxth = Math.max(...thn_saved_data)/pi;
    var n_pi_max = maxth;
    var minth = Math.min(...thn_saved_data)/pi;
    var n_pi_min = minth;
    if (n_pi_min > -1){n_pi_min=-1}
    if (n_pi_max < 1){n_pi_max=1}

    var grid_size = canvas[canvas.length-1].offsetWidth/40;
    var y_offset = grid_size/4;
    if (canvas_ID == 0){
        // draw axes
        l = canvas[canvas.length-1].getContext('2d');
        l.clearRect(0, 0, canvas[canvas.length-1].offsetWidth, canvas[canvas.length-1].offsetHeight);

        var canvas_width = canvas[canvas.length-1].offsetWidth;///-6; // account for padding
        var canvas_height = canvas[canvas.length-1].offsetHeight+4;

        //y axis
        l.beginPath();
        l.lineWidth = 1.5;
        l.strokeStyle = "#FBFAF5";
        l.moveTo(grid_size*y_offset,0);//grid_size);
        l.lineTo(grid_size*y_offset,canvas_height);//canvas_height-grid_size);
        l.stroke();

        // y-axis label
        l.font = Math.round(24*canvas_width/400).toString()+"px Times";
        l.fillStyle = "#FBFAF5";
        l.textAlign = 'start';//'\u2212'+
        l.fillText('\u03B8', 0, 3*grid_size);
    }

    // Translate to the new origin. Now Y-axis of the canvas is opposite to the Y-axis of the graph. So the y-coordinate of each element will be negative of the actual
    l = canvas[canvas.length-1].getContext('2d');
    l.save();
    l.translate(y_offset*grid_size, canvas_height * n_pi_max/(n_pi_max+Math.abs(n_pi_min)));

    //x-axis
    l.beginPath();
    l.lineWidth = 1.5;
    l.strokeStyle = "#FBFAF5";
    l.moveTo(-0.5*grid_size,0)
    l.lineTo(canvas_width-y_offset*grid_size-0.5,0);
    l.stroke();

    var sc_thx = function(x) { return x*(Math.round(canvas_width/grid_size)-y_offset)*grid_size/prior_points_to_plot;}
    var sc_thy = function(y) { return -y*(canvas_height-grid_size)/((n_pi_max-n_pi_min)*pi);}

    // plot theta displacement
    if (counter<prior_points_to_plot){
        x_pt = sc_thx(0);
        y_pt = sc_thy(thn_saved_data[oldest_i]);
        for (i=1; i<counter; i++){
            l.beginPath();
            l.moveTo(x_pt, y_pt);
    
            var j = mod(i+oldest_i,prior_points_to_plot);
            x_pt = sc_thx(i);
            y_pt = sc_thy(thn_saved_data[i]);
    
            l.lineTo(x_pt, y_pt);
            l.strokeStyle = lr_color[canvas_ID]
            l.lineWidth = 1.5;
            l.stroke();
        }
    }else{
        x_pt = sc_thx(0);
        y_pt = sc_thy(thn_saved_data[oldest_i]);
        for (i=1; i<prior_points_to_plot-1; i++){
            l.beginPath();
            l.moveTo(x_pt, y_pt);
    
            var j = mod(i+oldest_i,prior_points_to_plot);
            x_pt = sc_thx(i);
            y_pt = sc_thy(thn_saved_data[j]);
    
            l.lineTo(x_pt, y_pt);
            l.strokeStyle = lr_color[canvas_ID]
            l.lineWidth = 1.5;
            l.stroke();
        }
    }

    l.restore();

}

    // translates matlab origin (center) to canvas origin (bottom left corner)
    function sx(x){
        return x = (x)*canvas[0].offsetWidth/lw_matlab;
    }
    function sy(x){
        return x = (-x)*canvas[0].offsetWidth/lw_matlab;
    }
    function px(x){
        return x = (x + 0.5*lw_matlab)*canvas[0].offsetWidth/lw_matlab;
    }
    function py(x){
        return x = (-x + 0.55*lw_matlab)*canvas[0].offsetWidth/lw_matlab;
    }


    function easeInOutCubic(t, b, c, d) {
        t = t/(d/2);
        if (t < 1){ return c/2*t*t*t + b;}
        t = t - 2;
        return c/2*(t*t*t + 2) + b;
    };


    function wrap_pi(x,x_min,x_max) {
        return (((x - x_min*pi) % (x_max*pi - x_min*pi)) + (x_max*pi - x_min*pi)) % (x_max*pi - x_min*pi) + x_min*pi; 
    }

    function wx_scale(x){
        return px(x*x_scale_factor);
    }
    function ay_scale(x){
        return py(x*y_scale_factor);
    }

    function phase_scale_init(){

        x_scale_factor = 0;
        var b = [-0.00021497,-0.00278710,-0.00921923,0.01327608,0.09035812,-0.01482469,-0.25627894,0.10428935,0.46598978,-1.49727449,1.83184009];
        for (let i = 0; i<b.length;i++){
            x_scale_factor = x_scale_factor + b[i]*Math.pow(Math.log10(parms.C0),b.length-i-1);
        }

        if(parms.C0<0.0012){
            y_scale_factor = 4.5;
        }else{
            y_scale_factor = 0;
            var b = [0.01999869,0.00787850,-0.27907936,-0.00589745,1.40979993,-0.43542061,-2.94864645,1.62604552,2.58566957,-2.85753548,1.43889956];
            for (let i = 0; i<b.length;i++){
                y_scale_factor = y_scale_factor + b[i]*Math.pow(Math.log10(parms.C0),b.length-i-1);
            }
        }

        var radius_available = perc_interior_to_plot*( parms.R*(1-parms.wc/2) );

        x_scale_factor = radius_available/x_scale_factor;
        y_scale_factor = radius_available/y_scale_factor;

        return;


    }



