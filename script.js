// ==UserScript==
// @name     Ao3 Autofilter
// @version  0.1
// @match 	 https://archiveofourown.org/works/search?*
// @match    https://archiveofourown.org/works?*
// @match    https://archiveofourown.org/tags/*/works*
// @grant    GM.setValue
// @grant    GM.getValue
// ==/UserScript==


applyFilters();

const fieldset = document.getElementsByTagName("fieldset")[1];
const submitButtons = fieldset.getElementsByClassName("submit actions");
const button = submitButtons[0];
button.innerHTML += '<input type="button" style="width: 100%;" value="Set current filters as default" id="setFilterButton">';
document.getElementById("setFilterButton").addEventListener("click", setFilters);

function setFilters () {
  const url = window.location.href;
  const {baseUrl, params} = parseUrl(url);
  console.log(params);
  GM.setValue("filters", JSON.stringify(params));
}

async function applyFilters () {
    const url = window.location.href;
  	const {baseUrl, params} = parseUrl(url, false);
  	if (!(params.isRedirected === 'true')) {
      const filter = JSON.parse(await GM.getValue('filters', '{}'));
  		const newParams = mergeParams(filter, params);
  		newParams.isRedirected = 'true';
      console.log(baseUrl);
  		const newUrl = buildUrl(baseUrl, newParams);
      console.log(`Redirecting to ${newUrl}`);
  		window.location.replace(newUrl);
    }
    
}


function parseUrl (url, shouldExcludeTagId = true) {
    const excludeFilterTags = [
        'commit',
        'utf8',
        'tag_id',
      	'isRedirected'
    ];
    const decodedUrl = decodeURI(url);
    const paramStr = decodedUrl.substring(decodedUrl.indexOf('?') + 1);
    let baseUrl = decodedUrl.substring(0, decodedUrl.indexOf('?'));
    const splitParams = paramStr.split('&');

    const params = {};
  
  	if (baseUrl.length === 0) {
      baseUrl = decodedUrl;
    }

    for (let param of splitParams) {
        let isArray = false;
        if (param.indexOf('[]') > -1) {
            isArray = true;
        }

        const splitParam = param.split('=');
        const filterName = splitParam[0];
        if ((!excludeFilterTags.includes(filterName)) || (excludeFilterTags.includes(filterName) && !shouldExcludeTagId)) {
            if (isArray) {
                if (!params[filterName]) {
                    params[filterName] = [];
                }
                params[filterName].push(splitParam[1]);
            } else {
                params[filterName] = splitParam[1];
            }
        }
        
    }



    return {baseUrl, params};
}


function mergeParams (filter, newParams) {
    const params = JSON.parse(JSON.stringify(newParams)); // deep copy

    for (const filterElem in filter) {
        const filterValue = filter[filterElem];
        const isArray = typeof filterValue != 'string';

        if (params[filterElem] && params[filterElem] != filterValue) {
            // Parameter already exists, merge
            if (isArray) {
                params[filterElem] = params[filterElem].concat(filterValue);
            }
            // For non-array items, default to new param value
        } else {
            // Parameter doesn't exist, add
            params[filterElem] = filterValue;
        }
    }

    return params;
}


function buildUrl (baseUrl, paramObj) {
    let url = baseUrl;
    const parsedParams = [];

    for (const param in paramObj) {
        
        const filterName = param;
        const value = paramObj[param];
        const isArray = typeof value != 'string';
        
        if (value) {
          
            if (isArray) {
                // todo
                for (const v of value) {
                    parsedParams.push(`${filterName}=${v}`);
                }
            } else {
                parsedParams.push(`${filterName}=${value}`);
            }
        }
    }

    url += '?' + parsedParams.join('&');

    return url;
}
