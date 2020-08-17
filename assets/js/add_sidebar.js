$(document).ready(function(){
  $("#header").load("sidebar.html", function() {
    $('.menu-item > a').click(function(e){
      e.preventDefault();
      $(this).next('.sub-menu').slideToggle();
    });
    });
});