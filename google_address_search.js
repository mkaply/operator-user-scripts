/**
 * $Id: google_address_search.js 12145 2007-10-14 22:58:50Z doconnor $
 */
var google_address_search = {
    description: "Find Real Estate listings",
    shortDescription: "Real Estate listings",
    icon: "http://www.google.com/favicon.ico",
    scope: {
        semantic: {
            "adr" : "adr"
        }
    },

    doAction: function(semanticObject, semanticObjectType) {
        var hcard, adr, url;

        if ((semanticObjectType == "hCard") || (semanticObjectType == "adr")) {
            if (semanticObjectType == "hCard") {
                adr = semanticObject.adr[0];
            } else {
                adr = semanticObject;
            }

            url = "http://www.google.com/search?q=allintitle:";
            if (adr["street-address"]) {
                url += adr["street-address"].join(" ");
                url += " ";
            }
            if (adr.locality) {
                url += adr.locality;
                url += " ";
            }

            return url;

        }
    }
};

SemanticActions.add("google_address_search", google_address_search);