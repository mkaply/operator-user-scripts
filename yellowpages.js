/**
 * $Id: yellowpages.js 14894 2008-01-10 05:00:38Z doconnor $
 */
var yellowpages_search = {
    description: "Find on Yellowpages.com.au",
    shortDescription: "Yellowpages",
    icon: "http://www.yellowpages.com.au/favicon.ico",
    scope: {
        semantic: {
            "hCard" : "org"
        }
    },

    doAction: function(semanticObject, semanticObjectType) {
        var hcard, adr, url;

        if (semanticObjectType == "hCard") {
            hcard = semanticObject;

            if (hcard.adr) {
                adr = hcard.adr[0];
            }

            url = 'http://www.yellowpages.com.au/search/postSearchEntry.do?';

            if (hcard.org) {
                if (hcard.org.fn) {
                    url += 'businessName=' + encodeURIComponent(hcard.org.fn);
                } else {
                    url += 'businessName=' + encodeURIComponent(hcard.fn);
                }
            }

            if (adr) {
                if (adr['postal-code']) {
                    url += '&locationClue=' + encodeURIComponent(adr['postal-code']);
                }
            }

            url += '&sortByClosestMatch=true';
            url += '&sortByDetail=true';
            url += '&currentLetter=';
            url += '&clueType=1';
            url += '&sortByAlphabetical=false';
            url += '&sortByDistance=false';

            return url;

        }
    }
};

SemanticActions.add("yellowpages_search", yellowpages_search);