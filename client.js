var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1cYOaqDscPMAe-msW_GL8_IWwPTxKQEj7M44ImEafW6s/edit?usp=sharing';

var get_one_of_fields = function(e, fields) {
  for(i=0;i<fields.length;i++) {
    if(fields[i] in e) {
      return e[fields[i]];
    }
  }
}

var get_colour = function(sheet, e) {
	sheet_varname = sheetname_to_varname(sheet);
	if(sheet_varname in colours) {
		return colours[sheet_varname];
	} else {
		return 'coral';
	}
}

var prepare_classes = function(sheet, e) {
  var classes = 'grid-item';
  if(make_element_large(e)) {
    classes += ' grid-item--width2x';
  }
  classes += ' grid-'+sheetname_to_varname(sheet);
  return classes;
}

var prepare_link = function(e) {
  if(e['Link']) {
    return '<a href="'+e['Link']+'">See more</a>';
  }
}

var prepare_content = function(e) {
  return e['Publication info'];
}

var make_element_large = function(e) {
  if(prepare_author(e).length > 20) return true;
  return false;
}

var prepare_category = function(e) {
  return e['Main category'] + ' '+ e['Additional tags'];
}

var prepare_author = function(e) {
  return get_one_of_fields(e, ['Artist/ Curator', 'Author/ Editor', 'Organisation', 'Director']);
}

var get_crime_types = function(data) {
  crime_types = [];
  keys = Object.keys(data.elements[0]);
  return keys.slice(keys.indexOf("Description")+1,keys.length);
}

var get_groups = function(data) {
  cur_group = '';
  groups = {};
  data.elements.forEach(function(e) {
    if(e['UN Principal Organs'] != cur_group) {
      gr = e['UN Principal Organs'];
      cur_group = gr;
      groups[gr] = [];
    }
    groups[gr].push(e);
  });
  return groups;
}

var get_group_name = function(e) {
  return e['UN Principal Organs'];
}

var get_inner_group_name = function(e) {
  return e['Entity Name'];
}

var get_entity_class = function(e) {
  class_name = e['UN Principal Organs'];
  if(class_name === 'Peacebuilding Commission' || class_name === 'International Court of Justice' || class_name === 'Trusteeship Council') {
    return 'small-entity';
  }
  if(!get_acronym(e)) { return 'entity-name-nohide'; }
  return 'entity-name';
}

var get_colour = function(e) {
  switch(e['UN Principal Organs']) {
  case 'General Assembly':
    return 'rgba(218, 224, 144, 0.99)';
  case 'Security Council':
    return 'rgba(254, 213, 159, 0.99)';
  case 'Economic and Social Council':
    return 'rgba(202, 233, 235, 0.99)';
  case 'Secretariat':
    return 'rgba(254, 227, 133, 0.99)';
  case 'International Court of Justice':
    return 'rgba(203, 196, 222, 0.99)';
  case 'Trusteeship Council':
    return 'rgba(221, 208, 194, 0.99)';
  case 'Peacebuilding Commission':
    return 'rgba(255, 127, 80, 0.99)';
  }
  return 'coral';
}

var get_classes = function(e) {
  if(e['UN Principal Organs'] == 'General Assembly') { return 'grid-item--width2'; }
  if(e['UN Principal Organs'] == 'Economic and Social Council') { return 'grid-item--width2'; }
  if(e['UN Principal Organs'] == 'Secretariat') { return 'grid-item--width2'; }
  return '';
}
var get_header_class = function(e) {
  class_name = e['UN Principal Organs'];
  if(class_name === 'Peacebuilding Commission' || class_name === 'International Court of Justice' || class_name === 'Trusteeship Council') {
    return 'small-header';
  } else {
    return ''
  }
}

var get_crime_type_class = function(classname) {
  switch (classname) {
    case "Human Trafficking & Smuggling": return 'crime-trafficking';
    case "Environmental Crime": return 'crime-environmental';
    case "Arms Trafficking": return 'crime-arms';
    case "Drugs": return 'crime-drugs';
    case "Cybercrime": return 'crime-cyber';
    case "Financial Crime": return 'crime-financial';
  }
  return 'crime-'+classname.replace(' ','');
}

var get_inner_classes = function(e) {
  classes = [];
  glob_crime_types.forEach(function(c) {
    if(e[c] && e[c] != "FALSE") {
      classes.push(get_crime_type_class(c));
    }
  });
  class_name = e['UN Principal Organs'];
  if(class_name === 'Peacebuilding Commission' || class_name === 'International Court of Justice' || class_name === 'Trusteeship Council') {
    classes.push('grid-item-small')
  }
   return classes.join(' ');
}

var get_grid_class_text = function(e) {
  return e.replace(/[^a-z0-9 ]/gi,'').replace(new RegExp(' ', 'g'),'-');
}
var get_grid_class = function(e) {
  text = e[0]['UN Principal Organs'];
  return get_grid_class_text(text);
}

var get_acronym = function(e) {
  if (e['Entity Acronym'] != e['Entity Name']) {
    return e['Entity Acronym'];
  }
}

var get_description = function(element,data) {
  var name = element['Entity Name'];
  var descriptions = data['Entities'].elements.find(function(e) {
    return e['Entity Name'] === name
  })
  types = get_crime_types(data['Entities']);
  descr = {};
  types.forEach(function(e) { descr[e] = descriptions[e]; });
  return JSON.stringify(descriptions);
}

var process_sheet = function(data) {
  var groups = get_groups(data['Entities']);
  var template = $('#template').html();
  Mustache.parse(template);
  Object.keys(groups).forEach(function(k) {
    e = groups[k];
    grid_class = get_grid_class(e);
    var view = {
      'colour': get_colour(e[0]),
      'classes': get_classes(e[0]),
      'header_class': get_header_class(e[0]),
      'group_name': get_group_name(e[0]),
      'inner-grid-name': grid_class
    };
    var output = Mustache.render(template, view);
    $('.grid').append(output);
    process_inner_grid(groups[k], '.grid-inner-'+grid_class, data);
  });
}

var fix_div_sizes = function(grid_inner,class_name) {
      var children = grid_inner.children('.grid-item-inside');
    // hacky solution to issue of false resizing of boxes
    if(class_name === 'Peacebuilding-Commission' || class_name === 'Economic-and-Social-Council' || class_name === 'Security-Council' || class_name === 'International-Court-of-Justice' || class_name === 'Trusteeship-Council') {
      var topp = parseInt($(children[children.length-1]).css('top').replace('px',''));
      var child_height = $(children[children.length-1]).height();
      grid_inner.css('height', topp+child_height+20);
    }
}

var stamp_inner_grids = function(data,stamp) {
  var groups = get_groups(data['Entities']);
  Object.keys(groups).forEach(function(k) {
    var class_name = get_grid_class_text(k);
    var grid_inner = $('.grid-inner-'+class_name);
    grid_inner.isotope('stamp',stamp);
    grid_inner.isotope('layout');
    fix_div_sizes(grid_inner, class_name);
    if(class_name === 'General-Assembly') {
      grid_inner.isotope({layoutMode: 'masonry'});
      grid_inner.isotope('layout');
    }
  });
  glob_grid.isotope('layout');
}

var process_inner_grid = function(elements, grid_class, data) {
  var template = $('#templateinner').html();
  Mustache.parse(template);
  elements.forEach(function(e) {
    if(e['Hide?'] == "TRUE") { return; }
    var view = {
      'colour': get_colour(e),
      'group_name': get_inner_group_name(e),
      'entity_class': get_entity_class(e),
      'classes': get_inner_classes(e),
      'acronym': get_acronym(e),
      'descriptions': get_description(e,data),
    };
    var output = Mustache.render(template, view);
    $(grid_class).append(output);
  });
  $(grid_class).isotope({
    itemSelector: '.grid-item-inside',
    layoutMode: 'packery',
    stamp: '.stamp'
  });
}

function getPosition(string, subString, index) {
   return string.split(subString, index).join(subString).length;
}

var change_opacity = function(e,val,delay=1000) {
  var currentColor = $(e).css('background-color');
  var lastComma = getPosition(currentColor, ',', 3);
  var newColor = currentColor.slice(0, lastComma) + ", "+ val + ")";
  $(e).animate({'background-color': newColor},delay);
}

var get_index = function(e) {
  var parent = $(e).parent();
  var children = parent.children();
  for (i=0;i<children.length;i++) {
    if(e===children[i]) return i;
  }
  return 1;
}
var get_total_length = function(e) {
  return $(e).parent().children().length;
}

var easeout = function (val, max) {
  t = val/max;
  x = t;
  return x;
}

var distance = function(x1,y1,x2,y2) {
  var a = x1 - x2;
  var b = y1 - y2;
  return Math.sqrt( a*a + b*b );
}

var get_delay = function(e,reverse=false) {
  var cl = $(e).parent().attr("class");
  var x1 = $(e).position().left;
  var y1 = $(e).position().top;
  var x2 = $(e).parent().width();
  if(cl === 'grid-inner-Secretariat' || cl === 'grid-inner-Security-Council' ) {
    var x2=0;
  }
  var y2 = $(e).parent().height();
  var total_distance = distance(0,0,x2,y2);
  var cur_distance = distance(x1,y1,x2,y2);
  if(cl === 'grid-inner-Secretariat' || cl === 'grid-inner-General-Assembly') {
    if(reverse) {
      return easeout(cur_distance,total_distance)*1500;
    } else {
      return easeout(total_distance-cur_distance,total_distance)*1500;
    }
  }
  if(reverse) {
    return easeout(total_distance-cur_distance,total_distance)*1500;
  } else {
    return easeout(cur_distance,total_distance)*1500;
  }
}

var highlight = function() {
  crime_class = get_crime_type_class(glob_selection);
  $('.'+crime_class).each(function(i,e) {
    setTimeout(function(){
    $(e).addClass('highlight-grid-item');
  },1500);
  });
  $('.grid-item-inside:not(.'+crime_class+')').each(function(i,e) {
    setTimeout(function(){
      $(e).addClass('unhighlight-grid-item');
    },get_delay(e));
  });
  $('.cardbody').each(function(i,e) {
    change_opacity(e,'0.0');
  });
  $('.header').each(function(i,e) {
    change_opacity(e,'0.0');
    $(e).addClass('hide-header');
  });
}

var switch_highlight = function() {
  crime_class = get_crime_type_class(glob_selection);
  $('.highlight-grid-item').each(function(i,e) {
    $(e).removeClass('highlight-grid-item');
  });
  $('.unhighlight-grid-item').each(function(i,e) {
    setTimeout(function(){
      $(e).removeClass('unhighlight-grid-item');
    },get_delay(e)/2);
  });
  $('.grid-item-inside:not(.'+crime_class+')').each(function(i,e) {
    setTimeout(function(){
      $(e).addClass('unhighlight-grid-item');
      //    change_opacity($(e).children()[0],'0');
    },get_delay(e)/2+500);
  });
  $('.'+crime_class).each(function(i,e) {
    setTimeout(function(){
    $(e).addClass('highlight-grid-item');
  },1500);
  });
}

var remove_highlight = function() {
  $('.highlight-grid-item').each(function(i,e) {
    $(e).removeClass('highlight-grid-item');
  });
  $('.unhighlight-grid-item').each(function(i,e) {
    setTimeout(function(){
      $(e).removeClass('unhighlight-grid-item');
    },get_delay(e,true));
  });
  setTimeout(function(){
    $('.cardbody').each(function(i,e) {
      change_opacity(e,'0.99');
    });
  },800);
  $('.header').each(function(i,e) {
    change_opacity(e,'0.99');
    $(e).removeClass('hide-header');
    $($(e).children()).attr('style','');
    $('#span-Secretariat').css('padding-bottom','8px');
  });
}

var generate_dropdown = function(element,crime_types) {
  crime_types.forEach(function(c) {
    $(element).append('<a class="dropdown-item crimeselection" href="javascript:return false">'+c+'</a>');
  });
}

function display_modal(object) {
  var inst = $('[data-remodal-id=modal]').remodal();
  var descriptions = JSON.parse($(object).attr('data-descriptions'));
  var converter = new showdown.Converter();
  var html = converter.makeHtml(descriptions[glob_selection]);
  if(glob_selection === 'General Description') { var html = converter.makeHtml(descriptions['Description']); }
  html += '</ul><button data-remodal-action="confirm" class="remodal-confirm">OK</button>';
  inst.$modal.html(html);
  inst.open();
}

var move_button_interface = function(div) {
  var quantity_of_elements = Math.floor ( ($('.grid-inner-General-Assembly').width() - 30) / 75 - 1);
  var left = 70 + (quantity_of_elements-1) * (10 + $('.grid-item-inside-text').width());
  var top = $('.grid-inner-General-Assembly').height() + 5;
  $(div).css('left',left);
  $(div).css('top',top);
  if($(window).width() < 860) {
    $(div).css('left',0);
    $(div).css('top',0);
    $(div).detach();
    $(div).removeClass('stamp');
    $('.nogridbuttons').append(div);
    $(div).css('display','inline-block');
    $(div).css('margin-bottom','25px');
  }
}

var change_dropdown_text = function(text) {
  if(text === 'Human Trafficking & Smuggling') {
    text = 'Human Traff. & Smugg.';
  }
  $(".dropdown-toggle").html(text+'&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;')
}

var glob_crime_types;
var glob_selection = 'General Description';
var glob_grid;
$(function() {
  Tabletop.init({
    key: publicSpreadsheetUrl,
    callback: function gotData (data, tabletop) {
      $("#loadingdiv").fadeOut(400);
      glob_crime_types = get_crime_types(data['Entities']);
      process_sheet(data);
      $('.header').each(function (i,a) {
        $(a).bigtext({maxfontsize: 45,minfontsize: 6});
      });
      $('.grid-item-inside-text > .small-entity').each(function (i,a) {
        b = $(a).parent();
        $(b).bigtext({maxfontsize: 45,minfontsize: 6});
      });
      glob_grid = $('.grid').isotope({
        itemSelector: '.grid-item',
        percentPosition: true,
        layoutMode: 'packery',
        masonry: {
          columnWidth: '.grid-sizer'
        },
      });
      glob_grid.append('<div id="dropdown-group"><div class="dropdown stamp"><img id="gilogo" src="globalinitiative.png"><button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Select crime type &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;</button><div class="dropdown-menu" aria-labelledby="dropdownMenuButton"></div>');
      $('.dropdown-menu').append('<a id="clear-button" class="dropdown-item" href="javascript:return false;">Select all</a>');
      generate_dropdown($(".dropdown-menu"),glob_crime_types);
      $(".crimeselection").click(function(){
        if(glob_selection === 'General Description') {
          // first highlight
          glob_selection = $(this).text();
          highlight();
        } else {
          glob_selection = $(this).text();
          switch_highlight();
        }
        $(".btn:first-child").text('Select all');
        $('.grid').css({"background-image": 'linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url("logobig.png")'});
        change_dropdown_text($(this).text());
     });
     $('#clear-button').click(function(){
        remove_highlight();
        glob_selection = 'General Description';
        change_dropdown_text('Select crime type');
        setTimeout(function(){
        $('.grid').css({"background-image": 'none'})},1400);
     });
      move_button_interface($('.stamp'));
      stampe = glob_grid.find('.stamp');
      stamp_inner_grids(data,stampe);
      $('.grid-inner-Economic-and-Social-Council').isotope('layout');
      $('.grid').isotope('layout');
      fix_div_sizes($('.grid-inner-Economic-and-Social-Council'),'Economic-and-Social-Council');
      $('.grid').isotope('layout');
 if($(window).width() > 999) {
      $('.grid-inner-General-Assembly').css('margin-left','125px');
      $('.grid-inner-General-Assembly').isotope('layout');
      $('.grid-inner-Security-Council').css('height','149px');
      $('.grid-inner-General-Assembly').css('height','352px');
      $('#span-Secretariat').css('padding-bottom','8px');
 }
    }
  });
  var inst = $('[data-remodal-id=modal]').remodal();
   inst.close();
})
