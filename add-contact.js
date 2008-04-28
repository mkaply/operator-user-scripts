

/**
 * A helper method to send http requests to the google services.
 */
function add_google_contact_send_request(method, url, content, auth, content_type) {
    request = new XMLHttpRequest();

    request.open(method, url, false);

    if (auth) {
        request.setRequestHeader("Authorization", "GoogleLogin auth=" + auth);
    }

    if (content_type) {
        request.setRequestHeader("Content-type", content_type);
    }

    try {
        request.send(content);

        if (request.status == 200 || request.status == 201 || request.status == 409) {
            return request.responseText;
        }
    } catch (ex) {
        dump(ex);

        if (Operator.debug) {
            alert(ex);
        }

		throw ex;
    }
}

/**
 * Extracts information out from a hCard semantic object
 * and returns a google-friendly XML representation.
 */
function add_google_contact_create_xml_from_vcard(hcard) {
    var i;
    var full_address;
    var email;
    var tel;
    var url;
    var xml = "";

    xml += "<atom:entry xmlns:atom='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005'>" + "\n";
    xml += "  <atom:category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/contact/2008#contact' />" + "\n";

    //Parse name
    xml += "  <atom:title type='text'>" + hcard.fn + "</atom:title> " + "\n";

    xml += "  <atom:content type='text'>Notes</atom:content>" + "\n";

    if (hcard.email) {
        for (i = 0; i < hcard.email.length; i++) {
            email = hcard.email[i];

            type = 'home';
            if (email.type && email.type[0] == 'work') {
                type = 'work';
            }

            xml += "     <gd:email rel='http://schemas.google.com/g/2005#" + type + "' address='" + email.value + "' />" + "\n";
        }
    }


    if (hcard.tel) {
        for (i = 0; i < hcard.tel.length; i++) {
            tel = hcard.tel[i];

            type = 'home';
            if (tel.type && tel.type[0] == 'work') {
                type = 'work';
            }
            xml += "     <gd:phoneNumber rel='http://schemas.google.com/g/2005#" + type + "'>"  + tel.value + "</gd:phoneNumber>" + "\n";
        }
    }

    // Not yet implemented :(
    if (hcard.url) {
        for (i = 0; i < hcard.url.length; i++) {
            /*
            url = hcard.url[i];
            if ('xmpp:' == url.substring(0, 5)) {
                xml += "     <gd:im address='" + url.substring(5) + "' protocol='http://schemas.google.com/g/2005#GOOGLE_TALK' rel='http://schemas.google.com/g/2005#home' />" + "\n";
            }
            */


            /** @todo    If I ever find the way to tell google about the right bit of api */
            /*
            if ('aim:goim?screenname=' == url.substring(0, 20)) {
                //xml += "     <gd:im address='" + url + "' protocol='http://schemas.google.com/g/2005#GOOGLE_TALK' rel='http://schemas.google.com/g/2005#home' />" + "\n";
            }
            if ('ymsgr:sendIM?' == url.substring(0, 13)) {
                //xml += "     <gd:im address='" + url + "' protocol='http://schemas.google.com/g/2005#GOOGLE_TALK' rel='http://schemas.google.com/g/2005#home' />" + "\n";
            }
            */
        }
    }

    if (hcard.adr) {
        for (i = 0; i < hcard.adr.length; i++) {
            adr = hcard.adr[i];
            full_address = "";
            if (adr["street-address"]) {
                full_address += adr["street-address"] + " ";
            }

            if (adr["locality"]) {
                full_address += adr["locality"] + " ";
            }

            if (adr["region"]) {
                full_address += adr["region"] + " ";
            }

            if (adr["postal-code"]) {
                full_address += adr["postal-code"] + " ";
            }

            if (adr["country-name"]) {
                full_address += adr["country-name"] + " ";
            }

            if (full_address != "") {
                xml += "     <gd:postalAddress rel='http://schemas.google.com/g/2005#work'>" + full_address + "</gd:postalAddress>" + "\n";
            }
        }
    }


    xml += "</atom:entry>" + "\n";

    return xml;
}

/**
 * Send a create contact request for the email & auth_token provided.
 *
 * The contact is described in xml.
 *
 * @see add_google_contact_create_xml_from_vcard()
 */
function add_google_contact_create_contact(email_address, auth_token, xml) {
    url = 'http://www.google.com/m8/feeds/contacts/' + escape(email_address) + "/base";

    return add_google_contact_send_request("POST", url, xml, auth_token, "application/atom+xml");
}

/**
 * Fetch an authorisation token for a given
 * username and password
 *
 * @return An authorisation token string
 */
function add_google_contact_login(username, password) {
    var url = 'https://www.google.com/accounts/ClientLogin';
    var content = "";

    content  += "accountType=HOSTED_OR_GOOGLE";
    content  += "&Email="  + username;
    content  += "&Passwd=" + password;
    content  += "&service=cp";
    content  += "&source=NoCompany-Operator-0.1";


    response = add_google_contact_send_request("POST", url, content, null, "application/x-www-form-urlencoded");


    // Sample response
    /*
    HTTP/1.0 200 OK
    Server: GFE/1.3
    Content-Type: text/plain

    SID=DQAAAGgA...7Zg8CTN
    LSID=DQAAAGsA...lk8BBbG
    Auth=DQAAAGgA...dk3fA5N
    */
    if (response) {
        parts = response.split("\n");
		if (parts[2].substring(5)) {
			return parts[2].substring(5);
		}
    }

    throw "Invalid or unknown response - Authentication probably failed for " + username;
}

function add_google_contact_get_login_details_ff2() {

    var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
                                    .getService(Components.interfaces.nsIPasswordManager);

    var e = passwordManager.enumerator;

    //Ask the existing password manager for google account details
    var queryString = 'https://www.google.com';

    while (e.hasMoreElements()) {
        try {
            var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);

            if (pass.host == queryString) {
                email_address = pass.user;
                password      = pass.password;

                //TODO: Check if the email_address is valid (I store my username without the @ details)
                return {email: email_address, password: password, auth_token: false};
            }
        } catch (ex) { 
            dump(ex);
            if (Operator.debug) {
                alert(ex);
            }
        }
    }

    //We didn't find the details. Oh dear.
    //Better ask nicely.

    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                            .getService(Components.interfaces.nsIPromptService);


    email_address = {value: ""};
    password      = {value: ""};
    check         = {value: true};

    var result = prompts.promptUsernameAndPassword(null, "", "Enter email and password for your Google Account:",
                                                   email_address, password, "Remember password", check);


    if (check.value) {
        try {
            passwordManager.addUser(queryString, email_address.value, password.value);
        } catch (ex) {
            dump(ex);
            if (Operator.debug) {
                alert(ex);
            }
        }
    }

    return {email: email_address.value, password: password.value, auth_token: false};
}

function add_google_contact_get_login_details_ff3() {

    var myLoginManager = Components.classes["@mozilla.org/login-manager;1"]
								   .getService(Components.interfaces.nsILoginManager);
    
	var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                             Components.interfaces.nsILoginInfo,
                                             "init");

	var hostname = 'https://www.google.com';
    var logins = myLoginManager.findLogins({}, hostname, hostname, null);

	//Fetch the last one
	for (var i = 0; i < logins.length; i++) {
		email_address = logins[i].username;
		password	  = logins[i].password;

		return {email: email_address, password: password, auth_token: false};
	}

    //We didn't find the details. Oh dear.
    //Better ask nicely.

    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                            .getService(Components.interfaces.nsIPromptService);


    email_address = {value: ""};
    password      = {value: ""};
    check         = {value: true};

    var result = prompts.promptUsernameAndPassword(null, "", "Enter email and password for your Google Account:",
                                                   email_address, password, "Remember password", check);


    if (check.value) {
        try {
			var authLoginInfo = new nsLoginInfo(hostname,
												null, 'Google login (operator)',
											    email_address.value, password.value, "", "");

			myLoginManager.addLogin(authLoginInfo);
        } catch (ex) {
            dump(ex);
            if (Operator.debug) {
                alert(ex);
            }
        }
    }

    return {email: email_address.value, password: password.value, auth_token: false};
}


function add_google_contact_get_login_details() {
	result = null;
    try {
		if ("@mozilla.org/passwordmanager;1" in Components.classes) {
	        result = add_google_contact_get_login_details_ff2();
		} else if ("@mozilla.org/login-manager;1" in Components.classes) {
	        result = add_google_contact_get_login_details_ff3();
		}
    } catch (ex) {
        dump(ex);
        if (Operator.debug) {
            alert(ex);
        }
    }

	if (Operator.debug) {
		alert("Details: " + result.email + ", " + result.password);
	}
    return result;
}


var add_google_contact = {
    description: "Add to Google Contacts",
    shortDescription: "Add Google Contact",
    scope: {
        semantic: {
          "hCard" : "fn"
        }
    },
    doAction: function(semanticObject, semanticObjectType, propertyIndex) {
		var nb = getBrowser().getNotificationBox();
		var add_google_contact_login_details = {email: false, password: false, auth_token: false};

        //Do we have login details?
        if (add_google_contact_login_details.email == false) {
            if (Operator.debug) {
                alert("Finding login details");
            }
            add_google_contact_login_details = add_google_contact_get_login_details();

            //If the user cancelled finding them...
            if (add_google_contact_login_details.email == false) {
                if (Operator.debug) {
                    alert("User cancelled");
                }
                return false
            } else if (add_google_contact_login_details.email.indexOf('@') == -1) {
				add_google_contact_login_details.email = add_google_contact_login_details.email + "@gmail.com";
			}

        }

		if (Operator.debug) {
			alert("Finding auth token");
		}
		try {
			add_google_contact_login_details.auth_token = add_google_contact_login(add_google_contact_login_details.email,
																					add_google_contact_login_details.password);
		} catch (e) {
			nb.appendNotification(e + ", try switching on Operator's debug mode for more detail", "2", null, nb.PRIORITY_INFO_LOW, null);
			return;
		}

        if (Operator.debug) {
            alert("Creating XML from hcard");
        }
        xml = add_google_contact_create_xml_from_vcard(semanticObject);

        if (Operator.debug) {
            alert("Submitting");
        }
		try {
			result = add_google_contact_create_contact(add_google_contact_login_details.email, add_google_contact_login_details.auth_token, xml);
			if (Operator.debug) {
				alert(result);
			}

			nb.appendNotification(semanticObject.fn + " Added Successfully to your Google Contacts", "2", null, nb.PRIORITY_INFO_LOW, null);
		} catch (ex) {
			nb.appendNotification(ex, "2", null, nb.PRIORITY_INFO_LOW, null);
			return;
		}


    }
};

SemanticActions.add("add_google_contact", add_google_contact);