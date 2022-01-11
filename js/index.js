
var waterwheel_running = false;
check_C0_input()


/* #region | navigation links */
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav__link')
// opens menu tab when hamburger is clicked
navToggle.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
});
// closes menu tab when an option is clicked
// navLinks.forEach(link => {
//     link.addEventListener('click', () => {
// document.body.classList.remove('nav-open');
//     })
// });
// closes menu tab if clicking somewhere else on the page
$(document).ready(function () {
    $(document).click(function (event) {
        var clickover = $(event.target);
        var _opened = $("body").hasClass("nav-open");
        if (_opened === true && !clickover.hasClass("nav-toggle") && !clickover.hasClass("hamburger") && !clickover.hasClass("nav__list")) {
            document.body.classList.remove('nav-open');
            // console.log("cLoSe")
        }
        // console.log(clickover.attr("class").split(/\s+/))
    });
});
/* #endregion */



/* #region | make introduction scrolling pretty ---  */
var oneEm = $('.dummy-em').innerHeight();
$(window).scroll(function () {
    var scrollTop = $(window).scrollTop();
    var height = $(window).height() * 0.85;

    if (height > 1100) {
        height = 1100;
    } else if (height < 600) {
        height = 600;
    }

    $("#nameplate").css({
        'opacity': (height - 1.1 * scrollTop) / height,
        'margin-top': (height - 2 * scrollTop) / height * (5 * oneEm)
    });
    $(".chevron_down").css({
        'opacity': (height - 3 * scrollTop) / height
    });


});
/* #endregion */


/* #region | buttons ------------------------ */

// more info button:
function openDropdown(catagory) {

    var dropdownID = '#' + catagory + '_info';
    var buttonID = '#' + catagory + '_chevron';

    pauseWithUpdate();

    $('.dropdown-content').removeClass("holdClose");

    if (!($(dropdownID).hasClass("open"))) {

        // if hidden, expand

        // collapse all dropdowns, if wide screen disappear, else slide close
        if ($(window).outerWidth() > 900) {
            $('.dropdown-content').removeClass("slideClose");
            $('.dropdown-content.open').addClass("holdClose");
        } else {
            $('.dropdown-content').addClass("slideClose");
        }
        $('.dropdown-content.open').removeClass("open");

        // flip all open chevrons to down
        // $('.more-info__text.open').html('<br><i id="' + 'catagory' + '_chevron" class="chevron fas fa-chevron-down"></i>');
        // $('.more-info__text.open').removeClass('open');
        $('.chevron.open').removeClass('open');
        $('.more-info__text.open').removeClass('open');

        // expand the selected dropdown & flip chevron to up
        $(dropdownID).addClass("open");
        // $('.more-info__text.' + catagory).html(' <br><i id="' + 'catagory' + '_chevron" class="chevron fas fa-chevron-up"></i>');
        // $('.more-info__text.' + catagory).addClass('open');
        $('.more-info__text.' + catagory).addClass('open');
        $('#' + catagory + '_chevron').addClass('open');

        // intialize the selected dropdown with an opened 0th tab
        // remove open class from all nav-item buttons & tab containers
        $('.nav-item' + '.open').removeClass('open');
        $('.tab_container' + '.open').removeClass('open');

        // add open class to 0th nav-item button & tab container of selected dropdown
        $('.nav-item.' + catagory + '.tab_0').addClass('open');
        $('.tab_container.' + catagory + '.tab_0').addClass('open');

        // clear skill bars, init for opened catagory
        $('.tab_container.tab_0 .bar').removeClass("openDropdown");
        $('.tab_container.tab_0.' + catagory + ' .bar').addClass("openDropdown");

    } else {
        // if open, collapse
        $(dropdownID).removeClass("open"); // collapse selected dropdown
        $(dropdownID).addClass("slideClose");
        // flip chevron 
        // $('.more-info__text.' + catagory).html('<br><i id="' + 'catagory' + '_chevron" class="chevron fas fa-chevron-down"></i>');
        // $('.more-info__text.' + catagory).removeClass('open');
        $('.more-info__text.' + catagory).removeClass('open');
        $('#' + catagory + '_chevron').removeClass('open');

        // clear skill bars
        $('.tab_container.tab_0 .bar').removeClass("openDropdown");
    }
}

function openTab(catagory, tab) {

    var tabID = '#' + catagory + '_' + tab;

    // only do stuff if selected tab is closed
    if (!($(tabID).hasClass("open"))) {

        pauseWithUpdate();

        // remove open class from all nav-item button(s) & tab container(s) of selected dropdown
        $('.tab_container.' + catagory + '.open').removeClass('open');
        $('.nav-item.' + catagory + '.open').removeClass('open');
        // add open class to nav-item button & tab container of selected dropdown+tab
        $(tabID).addClass('open')
        $('.nav-item.' + catagory + '.tab_' + tab).addClass('open');

        if (catagory + tab == 'phys2' & !waterwheel_running) { init(); }

    }


}

/* #endregion */


/* #region  | make sure the more-info columns all have the same length */
determine_maxBlurbLength();
$(window).resize(function () {
    determine_maxBlurbLength();

    //redraw waterwheel if that's open
    if ($('.tab_container.phys.tab_2').hasClass("open")) {
        if (!waterwheel_running) {
            init();
        }
    };
});

function determine_maxBlurbLength() {

    var blurbs = $('.catagory_blurb');
    if ($(window).outerWidth() >= 900) {

        var max_height = 0;

        blurbs.css("height", "min-content");
        for (var i = 0; i < blurbs.length; i++) {
            var item = blurbs.eq(i);
            var height = item.height();
            if (height > max_height) { max_height = height; }
        }
        blurbs.css("height", max_height + 'px');

        var width = item.width();
        var leftMarg = $('.catagories').css('marginLeft').toString();
        var leftPad = $('.catagories').css('paddingLeft').toString();

        for (var i = 0; i < 3; i++) {
            // translate middle and right dropdowns to align left 
            $('.about-me > .about-me__inner .catagories .catagory:nth-child(' + (i + 1).toString() + ') > .dropdown-content')
                .css({
                    "transform": "translateX( calc( -" + ((i) * width).toString() + "px - " + ((i) * 3).toString() + "em - " + leftMarg + " - 0*" + leftPad + " ) )",
                    "width": "calc(300% + 6em + 2*" + leftMarg + " - 0*" + leftPad + " )"
                });
        }

    } else {
        blurbs.css("height", 'min-content');


        // translate middle and right dropdowns ZERO, to undo translate performed for wide screens
        for (var i = 0; i < 3; i++) {
            // translate middle and right dropdowns to align left 
            $('.about-me > .about-me__inner .catagories .catagory:nth-child(' + (i + 1).toString() + ') > .dropdown-content')
                .css({
                    "transform": "translateX( 0% )",
                    "width": "100%"
                });
        }



        // $('.about-me > .about-me__inner .catagories .catagory:nth-child(2) > .dropdown-content')
        //     .css("transform", "translateX( 0% )");
        // $('.about-me > .about-me__inner .catagories .catagory:nth-child(3) > .dropdown-content')
        //     .css("transform", "translateX( 0% )");

    }
}
/* #endregion */



/* #region  | waterwheel UI functions */

// run wheel if return is pressed in input field
const input_field = document.querySelectorAll('.inp')
input_field.addEventListener("keydown", function (e) {
    console.log(e)
    if (e.code === "Enter") {  //checks whether the pressed key is "Enter"
        init();
    }
});


function pauseWithUpdate() {
    // if waterwheel tab was open & running, pause the simulation
    if ($('.tab_container.phys.tab_2').hasClass('open') & $('#button--pausesim > .fas').hasClass("fa-pause")) {
        pause_waterwheel();
    }
}


function pause_waterwheel() {

    if (waterwheel_running) {
        if ($('#button--pausesim').hasClass("useable")) {
            $('#button--pausesim > .fas').toggleClass("fa-play");
            $('#button--pausesim > .fas').toggleClass("fa-pause");
            $('#button--pausesim').prop('title', "resume simulation");
        }
        if ($('#button--pausesim > .fas').hasClass("fa-pause")) {
            move();
            $('#button--pausesim').prop('title', "pause simulation");
        }
    }

}




// // Only show run button when input field is filled
function check_C0_input() {

    inp_val = $('#input--C0').val();

    if (isNaN(inp_val) | inp_val == "") {
        $('#button--runsim').removeClass("useable");
    } else {
        $('#button--runsim').addClass("useable");
        $('#button--runsim').html('Run');
        $('#button--runsim').prop('title', "start new simulation");
    }
}
/* #endregion */
