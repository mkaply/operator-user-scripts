var xmlns_kml = 'http://earth.google.com/kml/2.2';

function kml_create_placemark(name, description, lat, lon, alt) {
    var placemark, nameNode, descriptionNode;

    placemark = document.createElementNS(xmlns_kml, 'Placemark');

    nameNode = document.createElementNS(xmlns_kml, 'name');
    nameNode.appendChild(document.createTextNode(name));


    descriptionNode = document.createElementNS(xmlns_kml, 'description');
    descriptionNode.appendChild(document.createTextNode(description));

    pointNode = kml_create_point(lat, lon, alt);

    placemark.appendChild(nameNode);
    placemark.appendChild(descriptionNode);
    placemark.appendChild(pointNode);

    return placemark;
}

function kml_create_document() {
    var doc, kml;

    doc = document.implementation.createDocument(xmlns_kml,'kml',null);

    return doc;
}

function kml_create_point(lat, lon, alt) {
    var point;
    var coordinates;

    point = document.createElementNS(xmlns_kml, 'Point');
    coordinates = document.createElementNS(xmlns_kml, 'coordinates');
    coordinates.appendChild(document.createTextNode(lon + ',' + lat));

    point.appendChild(coordinates);

    return point;
}

function kml_open_file(filename) {
    var file = Components.classes["@mozilla.org/file/directory_service;1"].
                          getService(Components.interfaces.nsIProperties).
                          get("TmpD", Components.interfaces.nsIFile);


    file.append(filename);

    return file;
}


function kml_write_document(doc, filename) {
    var file = kml_open_file(filename);
    var fos = Components.classes["@mozilla.org/network/file-output-stream;1"].
                           createInstance(Components.interfaces.nsIFileOutputStream);
    var cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                           createInstance(Components.interfaces.nsIConverterOutputStream);

    fos.init(file, -1, -1, false);
    cos.init(fos, null, 0, null);

    var xml;
    var s = new XMLSerializer();

    var stream = {
        close : function() {},
        flush : function() {},
        write : function(string, count) {
                    cos.writeString(string);
                }
    };

    s.serializeToStream(doc, stream, "UTF-8");

    cos.close();
    fos.close();

    return file;
}

function kml_execute_url(file) {
    var url;
    var f = Components.classes["@mozilla.org/file/local;1"]
                      .createInstance(Components.interfaces.nsILocalFile);

    f.initWithPath(file.path);
    if (Components.classes["@mozilla.org/xre/app-info;1"]
                  .getService(Components.interfaces.nsIXULRuntime)
                  .OS == "Darwin") {
        f.launch();
        return true;
    }

    url = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService)
                    .newFileURI(f)
                    .spec;

    return url;
}

function kml_create_folder() {
    folder = document.createElementNS(xmlns_kml, 'Folder');
    return folder;
}

function kml_export_action(items) {
    var url;
    var doc;

    doc = kml_create_document();

    folder = kml_create_folder();

    for (i = 0; i < items.length; i++) {
        placemark = kml_create_placemark(items[i].toString(), '', items[i].latitude, items[i].longitude, 0);
        folder.appendChild(placemark);
    }

    doc.documentElement.appendChild(folder);

    file = kml_write_document(doc, 'geo.kml');

    url = kml_execute_url(file);

    return url;
}

var super_export_kml = {
    description: "Export KML Happily",
    descriptionAll: "Export All KML Happily",
    scope: {
        semantic: {
            "geo" : "geo"
        }
    },
    doActionAll: function(semanticArrays, semanticObjectType) {
        if (semanticObjectType == 'geo') {
            return kml_export_action(semanticArrays['geo']);
        }
    },
    doAction: function(semanticObject, semanticObjectType) {
        if (semanticObjectType == 'geo') {
            items = new Array();
            items[0] = semanticObject;
            return kml_export_action(items);
        }
    }
};

SemanticActions.add("super_export_kml", super_export_kml);