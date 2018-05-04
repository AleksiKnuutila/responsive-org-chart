var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1cYOaqDscPMAe-msW_GL8_IWwPTxKQEj7M44ImEafW6s/edit?usp=sharing';
var types = ["Artwork and exhibitions", "Cinema", "Organisations", "Theory"];
var types_varnames = ["artwork", "cinema", "organisations", "theory"];
var colours = {
	'artwork': '#66c2a5',
	'theory': '#fc8d62',
	'organisations': '#8da0cb',
	'cinema': '#e78ac3'
};

var global_selection;
var global_searchterm;
var type_clicked = function(type) {
  if(global_selection === type) {
    global_selection = '';
    deselect_type(type);
		update_selection();
  } else {
    if(global_selection) deselect_type(global_selection);
    global_selection = type;
    select_type(type);
		update_selection();
  }
}

var select_type = function(type) {
  types_varnames.forEach(function (t) {
    if(t!=type) $('#button-'+t).toggleClass('button-'+t);
  });
}

var deselect_type = function(type) {
  types_varnames.forEach(function (t) {
    if(t!=type) $('#button-'+t).toggleClass('button-'+t);
  });
}

var update_selection = function() {
//	$('.grid').isotope({ filter: function() {
//    var header = $(this).find('.header').text();
//    if(header.length < 3 || header.length > 30 || !/\S/.test(header)) return false;
//    if(global_selection) {
//      var classes = $(this).attr('class').split(' ');
//      if (!classes.includes('grid-'+global_selection)) return false;
//		}
//    if(global_searchterm) {
//  		var c = $(this).find('span').text();
//  		c += $(this).find('.title').text();
//  		c += $(this).find('.content').text();
//  		c += $(this).find('.category').text();
//      return c.search(new RegExp(global_searchterm, "i")) != -1;
//    }
//    return true;
//	}});
}

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

var sheetname_to_varname = function(sheetname) {
	switch(sheetname) {
		case 'Artwork and exhibitions':
			return 'artwork';
		case 'Theory':
			return 'theory';
		case 'Organisations':
			return 'organisations';
		case 'Cinema':
			return 'cinema';
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

var get_colour = function(e) {
  switch(e[0]['UN Principal Organs']) {
  case 'General Assembly':
    return '#dae090';
  case 'Security Council':
    return '#fed59f';
  case 'Economic and Social Council':
    return '#cae9eb';
  case 'Secretariat':
    return '#fee385';
  case 'International Court of Justice':
    return '#cbc4de';
  case 'Trusteeship Council':
    return '#ddd0c2';
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

var process_sheet = function(groups) {
  var template = $('#template').html();
  Mustache.parse(template);
//  data.elements.forEach(function(e) {
  Object.keys(groups).forEach(function(k) {
    e = groups[k];
    grid_class = get_grid_class(e);
    var view = {
      'colour': get_colour(e),
      'classes': get_classes(e[0]),
      'group_name': get_group_name(e[0]),
      'inner-grid-name': grid_class
    };
    var output = Mustache.render(template, view);
    $('.grid').append(output);
    process_inner_grid(groups[k], '.grid-inner-'+grid_class);
  });
}

var process_inner_grid = function(elements, grid_class) {
  var template = $('#templateinner').html();
  Mustache.parse(template);
//  data.elements.forEach(function(e) {
  elements.forEach(function(e) {
    var view = {
      'group_name': get_inner_group_name(e),
      'classes': get_inner_classes(e),
      'acronym': get_acronym(e),
    };
    var output = Mustache.render(template, view);
    $(grid_class).append(output);
  });
  $(grid_class).isotope({
    itemSelector: '.grid-item-inside',
  });
}


var glob_crime_types;
$(function() {
  Tabletop.init({
    key: publicSpreadsheetUrl,
    callback: function gotData (data, tabletop) {
      $("#loadingdiv").fadeOut(400);
      groups = get_groups(data['Entities']);
      glob_crime_types = get_crime_types(data['Crimes']);
      process_sheet(groups);
//      });
//      tabletop.modelNames.forEach(function(s) {
//        process_sheet(data[s]);
//      });
      $('.header').each(function (i,a) {
        $(a).bigtext({maxfontsize: 48});
      });
      $('.grid').isotope({
        itemSelector: '.grid-item',
        percentPosition: true,
        layoutMode: 'packery',
        masonry: {
          columnWidth: '.grid-sizer'
        }
      });
//			update_selection();
    }
  });
    $(".dropdown-menu").on('click', 'a', function(){
      $(".btn:first-child").text($(this).text());
      $(".btn:first-child").val($(this).text());
   });
})

