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
  data.elements.forEach(function(e) {
    crime_types.push(e.Crimes);
  });
  return crime_types;
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
  }
  return 'coral';
}

var get_classes = function(e) {
  if(e['UN Principal Organs'] == 'General Assembly') { return 'grid-item--width2'; }
  if(e['UN Principal Organs'] == 'Economic and Social Council') { return 'grid-item--width2'; }
  if(e['UN Principal Organs'] == 'Secretariat') { return 'grid-item--width2'; }
  return '';
}

var get_crime_type_class = function(classname) {
  switch (classname) {
    case "Human trafficking and smuggling": return 'crime-trafficking';
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
    if(e[c] && e[c] === "TRUE") {
      classes.push(get_crime_type_class(c));
    }
  });
  return classes.join(' ');
}

var get_grid_class = function(e) {
  text = e[0]['UN Principal Organs'];
  return text.replace(/[^a-z0-9 ]/gi,'').replace(new RegExp(' ', 'g'),'-');
}

var get_acronym = function(e) {
  if (e['Entity Acronym'] != e['Entity Name']) {
    return e['Entity Acronym'];
  }
}

var get_description = function(element,data) {
  var name = element['Entity Name'];
  var descriptions = data['Descriptions'].elements.find(function(e) { return e['Entity Name'] === name })
  return JSON.stringify(descriptions);
}

var process_sheet = function(data) {
  var groups = get_groups(data['Entities']);
  var template = $('#template').html();
  Mustache.parse(template);
//  data.elements.forEach(function(e) {
  Object.keys(groups).forEach(function(k) {
    e = groups[k];
    grid_class = get_grid_class(e);
    var view = {
      'colour': get_colour(e[0]),
      'classes': get_classes(e[0]),
      'group_name': get_group_name(e[0]),
      'inner-grid-name': grid_class
    };
    var output = Mustache.render(template, view);
    $('.grid').append(output);
    process_inner_grid(groups[k], '.grid-inner-'+grid_class, data);
  });
}

var process_inner_grid = function(elements, grid_class, data) {
  var template = $('#templateinner').html();
  Mustache.parse(template);
//  data.elements.forEach(function(e) {
  elements.forEach(function(e) {
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
  });
}

function getPosition(string, subString, index) {
   return string.split(subString, index).join(subString).length;
}

var change_opacity = function(e,val) {
  var currentColor = $(e).css('background-color');
  var lastComma = getPosition(currentColor, ',', 3);
  var newColor = currentColor.slice(0, lastComma) + ", "+ val + ")";
  $(e).animate({'background-color': newColor},500);
}

var highlight = function(crime_class) {
  $('.'+crime_class).each(function(i,e) {
    $(e).addClass('highlight-grid-item',300);
  });
  $('.grid-item-inside:not(.highlight-grid-item)').each(function(i,e) {
    $(e).addClass('unhighlight-grid-item',300);
    change_opacity($(e).children()[0],'0');
  });
  $('.cardbody').each(function(i,e) {
    change_opacity(e,'0.3');
  });
  $('.header').each(function(i,e) {
    change_opacity(e,'0.3');
  });
}

var switch_highlight = function(crime_class) {
  $('.highlight-grid-item').each(function(i,e) {
    $(e).removeClass('highlight-grid-item',900);
  });
//  $('.unhighlight-grid-item').each(function(i,e) {
//    $(e).removeClass('unhighlight-grid-item',300);
//    change_opacity($(e).children()[0],'0.99');
//  });
  $('.'+crime_class).each(function(i,e) {
    $(e).addClass('highlight-grid-item',900);
    change_opacity($(e).children()[0],'0.99');
  });
  $('.grid-item-inside:not(.highlight-grid-item)').each(function(i,e) {
    $(e).addClass('unhighlight-grid-item',900);
    change_opacity($(e).children()[0],'0');
  });
}

var remove_highlight = function() {
  $('.highlight-grid-item').each(function(i,e) {
    $(e).removeClass('highlight-grid-item',300);
  });
  $('.unhighlight-grid-item').each(function(i,e) {
    $(e).removeClass('unhighlight-grid-item',300);
    change_opacity($(e).children()[0],'0.99');
  });
  $('.cardbody').each(function(i,e) {
    change_opacity(e,'0.99');
  });
  $('.header').each(function(i,e) {
    change_opacity(e,'0.99');
  });
}

var generate_dropdown = function(element,crime_types) {
  crime_types.forEach(function(c) {
    $(element).append('<label class="btn btn-secondary"><input type="radio" name="options" id="option3" autocomplete="off">'+c+'</label>');
//    $(element).append('<a class="dropdown-item" href="#">'+c+'</a>');
  });
}

function display_modal(object) {
  var inst = $('[data-remodal-id=modal]').remodal();
  var descriptions = JSON.parse($(object).attr('data-descriptions'));
  var converter = new showdown.Converter();
  var html = converter.makeHtml(descriptions[glob_selection]);
  html += '</ul><button data-remodal-action="confirm" class="remodal-confirm">OK</button>';
  inst.$modal.html(html);
  inst.open();
}

var glob_crime_types;
var glob_selection = 'General Description';
var glob_grid;
$(function() {
  Tabletop.init({
    key: publicSpreadsheetUrl,
    callback: function gotData (data, tabletop) {
      $("#loadingdiv").fadeOut(400);
      glob_crime_types = get_crime_types(data['Crimes']);
      generate_dropdown($(".dropdown-menu"),glob_crime_types);
      process_sheet(data);
      $('.header').each(function (i,a) {
        $(a).bigtext({maxfontsize: 48,minfontsize: 6});
      });
      glob_grid = $('.grid').isotope({
        itemSelector: '.grid-item',
        percentPosition: true,
        layoutMode: 'packery',
        masonry: {
          columnWidth: '.grid-sizer'
        },
        stamp: '.stamp'
      });
        stampe = glob_grid.find('.stamp');
        glob_grid.isotope('stamp',stampe);
        glob_grid.isotope('layout');
//			update_selection();
    }
  });
    $(".dropdown-menu").on('click', 'a', function(){
//      remove_highlight();
      if(glob_selection === 'General Description') {
        // first highlightj
        highlight(get_crime_type_class($(this).text()));
      } else {
        switch_highlight(get_crime_type_class($(this).text()));
      }
      $(".btn:first-child").text($(this).text());
      $(".btn:first-child").val($(this).text());
      glob_selection = $(this).text();
   });
   $('#clear-button').click(function(){
      remove_highlight();
      glob_selection = 'General Description';
      $(".btn:first-child").text('Select crime type');
      $(".btn:first-child").val('Select crime type');
   });
   var inst = $('[data-remodal-id=modal]').remodal();
   inst.close();
})
