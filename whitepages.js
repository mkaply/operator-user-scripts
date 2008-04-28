/**
 * $Id: whitepages.js 13043 2007-11-13 03:45:38Z doconnor $
 */

function do_business_search(hcard) {
    url = 'http://whitepages.com.au/wp/busSearch.do?';

    if (hcard.fn) {
        url += 'subscriberName=' + encodeURIComponent(hcard.fn);
    }

    return url;
}

function do_residential_search(hcard) {
    var url = 'http://whitepages.com.au/wp/resSearch.do?';

    if (hcard.n) {
        url += 'subscriberName=' + encodeURIComponent(hcard.n["family-name"]);

        url += '&givenName=' + encodeURIComponent(hcard.n['given-name'].substr(0, 1));
    } else {
        var name = hcard.fn.split(' ');

        url += 'subscriberName=' + encodeURIComponent(name[name.length-1]);
        url += '&givenName=' + encodeURIComponent(name[0].substr(0, 1));
    }

    return url;
}

function do_search(semanticObject, semanticObjectType, type) {
    var hcard, adr, url;

    if (semanticObjectType == "hCard") {
        hcard = semanticObject;

        //Determine search type
        if (type == 'business') {
           url = do_business_search(hcard);
        } else {
           url = do_residential_search(hcard);
        }

        //Add in address
        if (hcard.adr) {
            adr = hcard.adr[0];
        }

        if (adr) {
            if (adr['postal-code']) {
                url += '&suburb=' + encodeURIComponent(adr['postal-code']);
            } else if (adr['locality']) {
                url += '&locality=' + encodeURIComponent(adr['locality']);
            }

            if (adr['region']) {
                url += '&state=' + encodeURIComponent(adr['region']);
            }

            if (adr['street-address']) {
                url += '&street=' + encodeURIComponent(adr['street-address']);
            }
        }

        url += '&textOnly=true';


        return url;
    }
}

var whitepages_residential_search = {
    description: "Find on Whitepages.com.au Residential",
    shortDescription: "Whitepages Residential",
    icon: "http://whitepages.com.au/wp/favicon.ico",
    scope: {
        semantic: {
            "hCard" : "hCard"
        }
    },

    doAction: function(semanticObject, semanticObjectType) {
        return do_search(semanticObject, semanticObjectType, 'residential');
    }
};

var whitepages_business_search = {
    description: "Find on Whitepages.com.au Business",
    shortDescription: "Whitepages Business",
    icon: "http://whitepages.com.au/wp/favicon.ico",
    scope: {
        semantic: {
            "hCard" : "org"
        }
    },

    doAction: function(semanticObject, semanticObjectType) {
        return do_search(semanticObject, semanticObjectType, 'business');
    }
};

SemanticActions.add("whitepages_residential_search", whitepages_residential_search);
SemanticActions.add("whitepages_business_search", whitepages_business_search);