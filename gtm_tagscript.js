<script>
(function() {
  console.log('GTM: Affiliate Link Decoration Script Started');

  // Get Analytics Data
  var analyticsData = {{Analytics data}};
  console.log('GTM: Analytics data:', analyticsData);

  // JHM update 02/04/26 - Don't exit if GA4 data unavailable; decorate with available data and use click handler fallback
  if (!analyticsData || !analyticsData.client_id || !analyticsData.session_id) {
    console.log('GTM: Analytics data not available yet - will use cookie fallback on click');
  } else {
    console.log('GTM: Analytics validated - client_id:', analyticsData.client_id, 'session_id:', analyticsData.session_id);
  }
  
  // ===== HELPER FUNCTIONS =====
  
  // Function to set cookie
  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
    console.log('GTM: Cookie set -', name, '=', value);
  }
  
  // Function to get cookie value
  function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }
  
  // Function to check if parameter exists in URL
  function hasParam(url, paramName) {
    return url.indexOf(paramName + '=') !== -1;
  }

  // Function to set or replace a URL parameter
  // JHM update 02/04/26 - Used for aff_sub to replace existing value if present
  function setOrReplaceParam(url, paramName, paramValue) {
    var urlObj = url.split('?');
    var baseUrl = urlObj[0];
    var queryString = urlObj[1] || '';
    var params = [];
    var paramAdded = false;

    if (queryString) {
      var pairs = queryString.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        if (pair[0] === paramName) {
          // Replace existing parameter
          params.push(paramName + '=' + encodeURIComponent(paramValue));
          paramAdded = true;
        } else {
          params.push(pairs[i]);
        }
      }
    }

    // Add parameter if it wasn't replaced
    if (!paramAdded) {
      params.push(paramName + '=' + encodeURIComponent(paramValue));
    }

    return baseUrl + (params.length > 0 ? '?' + params.join('&') : '');
  }

  // Function to get GA4 Client ID from _ga cookie
  // Format: GA1.1.XXXXXXXXXX.XXXXXXXXXX -> extract last two segments
  function getGA4ClientIdFromCookie() {
    var gaCookie = getCookie('_ga');
    if (!gaCookie) return null;
    var parts = gaCookie.split('.');
    if (parts.length >= 4) {
      return parts[2] + '.' + parts[3];
    }
    return null;
  }

  // Function to get GA4 Session ID from _ga_XXXXXX cookie
  // Format: GS2.1.SESSION_ID.TIMESTAMP... -> extract third segment
  function getGA4SessionIdFromCookie() {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      if (cookie.indexOf('_ga_') === 0) {
        var value = cookie.split('=')[1];
        if (value) {
          var parts = value.split('.');
          if (parts.length >= 3) {
            return parts[2];
          }
        }
      }
    }
    return null;
  }

  // ===== GET PAGE PATH =====
  var rawPath = window.location.pathname;
  // JHM update 02/04/26 - Handle homepage: blank or "/" becomes "homepage", others get slashes replaced with underscores
  var pagePath = (rawPath === '/' || rawPath === '') ? 'homepage' : rawPath.replace(/\//g, '_');
  console.log('GTM: Current page path:', rawPath, '-> formatted:', pagePath);
  
  // ===== GET YEP TRACKING PARAMETERS =====
  
  // Get values from GTM variables (URL parameters)
  var urlPubId = {{URL - pub_id}};
  var urlS2 = {{URL - s2}};
  var urlSubId = {{URL - sub_id}};
  
  console.log('GTM: URL parameters - pub_id:', urlPubId, 's2:', urlS2, 'sub_id:', urlSubId);
  
  // Get values from GTM variables (Cookies)
  var cookiePubId = {{Cookie - Yep pub_id}};
  var cookieS2 = {{Cookie - Yep s2}};
  var cookieSubId = {{Cookie - Yep sub_id}};
  
  console.log('GTM: Cookie values - pub_id:', cookiePubId, 's2:', cookieS2, 'sub_id:', cookieSubId);
  
  // If URL parameters exist, save them as cookies (30 days expiration)
  if (urlPubId) {
    setCookie('yep_pub_id', urlPubId, 30);
  }
  
  if (urlS2) {
    setCookie('yep_s2', urlS2, 30);
  }
  
  if (urlSubId) {
    setCookie('yep_sub_id', urlSubId, 30);
  }
  
  // Use URL parameters if available, otherwise fall back to cookies
  var pub_id = urlPubId || cookiePubId;
  var s2 = urlS2 || cookieS2;
  var sub_id = urlSubId || cookieSubId;
  
  console.log('GTM: Final Yep values - pub_id:', pub_id, 's2:', s2, 'sub_id:', sub_id);

  // ===== GET A/B TEST PARAMETERS =====

  // Get values from Data Layer Variables
  var dlAbVariant = {{dlv_abVariant}};
  var dlAbTestName = {{dlv_abTestName}};

  console.log('GTM: Data Layer A/B Test - abVariant:', dlAbVariant, 'abTestName:', dlAbTestName);

  // Get value from Cookie
  var cookieSubId3 = {{Cookie - AB Test sub_id3}};

  console.log('GTM: Cookie value - sub_id3:', cookieSubId3);

  // Combine abTestName and abVariant into sub_id3 format (e.g., "hero_a")
  var dlSubId3 = null;
  if (dlAbTestName && dlAbVariant) {
    dlSubId3 = dlAbTestName + '_' + dlAbVariant;
    console.log('GTM: Combined A/B test value:', dlSubId3);
  }

  // If Data Layer values exist, save combined value as cookie (30 days expiration)
  if (dlSubId3) {
    setCookie('ab_test_sub_id3', dlSubId3, 30);
  }

  // Use Data Layer value if available, otherwise fall back to cookie
  var sub_id3 = dlSubId3 || cookieSubId3;

  console.log('GTM: Final sub_id3 value (A/B test):', sub_id3);

  // ===== DECORATE NORDVPN LINKS =====

  // Function to decorate a single link or all links
  function decorateLinks(targetLinks) {
    var links = targetLinks || document.querySelectorAll('a[href*="go.nordvpn.net"]');
    var linksArray = Array.prototype.slice.call(links);
    var decoratedCount = 0;

    for (var i = 0; i < linksArray.length; i++) {
      var link = linksArray[i];

      // Skip if already decorated (marked with data attribute)
      if (link.getAttribute('data-gtm-decorated') === 'true') {
        continue;
      }

      var href = link.href;
      var params = [];

      console.log('GTM: Processing link:', href);

      // Get track label from data attribute and set aff_sub if not already present
      // JHM update 02/04/26 - Only set if aff_sub doesn't already exist (preserve existing values)
      var trackLabel = link.getAttribute('data-track-label');
      if (trackLabel && !hasParam(href, 'aff_sub')) {
        console.log('GTM: Setting aff_sub from data-track-label. Value:', trackLabel);
        href = setOrReplaceParam(href, 'aff_sub', trackLabel);
        link.href = href;
      }

      // Add GA4 Client ID (aff_unique1) if not present
      if (analyticsData && analyticsData.client_id && !hasParam(href, 'aff_unique1')) {
        params.push('aff_unique1=' + encodeURIComponent(analyticsData.client_id));
      }

      // Add GA4 Session ID (aff_unique2) if not present
      if (analyticsData && analyticsData.session_id && !hasParam(href, 'aff_unique2')) {
        params.push('aff_unique2=' + encodeURIComponent(analyticsData.session_id));
      }

      // Add GA4 User ID (aff_unique3) if available and not present
      if (analyticsData && analyticsData.user_id && !hasParam(href, 'aff_unique3')) {
        params.push('aff_unique3=' + encodeURIComponent(analyticsData.user_id));
      }

      // Add Timestamp (aff_unique4) if not present
      if (!hasParam(href, 'aff_unique4')) {
        params.push('aff_unique4=' + encodeURIComponent(Date.now()));
      }

      // Add Yep S2 Click ID (aff_click_id) if available and not present
      if (s2 && !hasParam(href, 'aff_click_id')) {
        params.push('aff_click_id=' + encodeURIComponent(s2));
      }

      // Add Page Path (aff_sub2) if not present
      if (!hasParam(href, 'aff_sub2')) {
        params.push('aff_sub2=' + encodeURIComponent(pagePath));
      }

      // Add A/B Test Data (aff_sub3) if available and not present
      if (sub_id3 && !hasParam(href, 'aff_sub3')) {
        console.log('GTM: Adding sub_id3 to aff_sub3. Value:', sub_id3);
        params.push('aff_sub3=' + encodeURIComponent(sub_id3));
      }

      // Add Yep Publisher ID (aff_sub4) if available and not present
      if (pub_id && !hasParam(href, 'aff_sub4')) {
        console.log('GTM: Adding pub_id to aff_sub4. Value:', pub_id);
        params.push('aff_sub4=' + encodeURIComponent(pub_id));
      }

      // Add Yep Sub ID (aff_sub5) if available and not present
      if (sub_id && !hasParam(href, 'aff_sub5')) {
        console.log('GTM: Adding sub_id to aff_sub5. Value:', sub_id);
        params.push('aff_sub5=' + encodeURIComponent(sub_id));
      }

      // Only update link if there are new parameters to add
      if (params.length > 0) {
        var separator = href.indexOf('?') === -1 ? '?' : '&';
        link.href = href + separator + params.join('&');
        console.log('GTM: ✓ Link decorated with:', params.join('&'));
        console.log('GTM: ✓ Final URL:', link.href);
        decoratedCount++;
      } else {
        console.log('GTM: ○ Link skipped - all parameters already present');
      }

      // Mark link as decorated
      link.setAttribute('data-gtm-decorated', 'true');
    }

    return decoratedCount;
  }

  // Decorate existing links on page load
  console.log('GTM: Decorating existing links...');
  var initialCount = decorateLinks();
  console.log('GTM: Decorated', initialCount, 'initial links');

  // Set up MutationObserver to watch for new links
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          var node = mutation.addedNodes[i];

          // Check if the added node is a link
          if (node.nodeType === 1 && node.tagName === 'A' && node.href && node.href.indexOf('go.nordvpn.net') !== -1) {
            console.log('GTM: New NordVPN link detected:', node.href);
            decorateLinks([node]);
          }

          // Check if the added node contains links
          if (node.nodeType === 1 && node.querySelectorAll) {
            var newLinks = node.querySelectorAll('a[href*="go.nordvpn.net"]');
            if (newLinks.length > 0) {
              console.log('GTM: Found', newLinks.length, 'new NordVPN links in added content');
              decorateLinks(newLinks);
            }
          }
        }
      }
    });
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('GTM: MutationObserver active - watching for new NordVPN links');

  // ===== CLICK HANDLER (CAPTURE PHASE) =====
  // JHM update 02/04/26 - Last line of defense: fills in GA4 data from cookies if missing
  document.addEventListener('click', function(e) {
    var target = e.target;

    // Find the closest anchor tag (in case user clicked child element)
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }

    // Check if it's a NordVPN link
    if (!target || !target.href || target.href.indexOf('go.nordvpn.net') === -1) {
      return;
    }

    console.log('GTM: Click detected on NordVPN link:', target.href);

    var href = target.href;
    var params = [];
    var modified = false;

    // Get track label from data attribute and set aff_sub if not already present
    // JHM update 02/04/26 - Only set if aff_sub doesn't already exist (preserve existing values)
    var trackLabel = target.getAttribute('data-track-label');
    if (trackLabel && !hasParam(href, 'aff_sub')) {
      console.log('GTM: Click handler setting aff_sub from data-track-label. Value:', trackLabel);
      href = setOrReplaceParam(href, 'aff_sub', trackLabel);
      target.href = href;
    }

    // Try to get GA4 data from cookies if not in URL
    if (!hasParam(href, 'aff_unique1')) {
      var clientId = getGA4ClientIdFromCookie();
      if (clientId) {
        params.push('aff_unique1=' + encodeURIComponent(clientId));
        console.log('GTM: Added client_id from cookie:', clientId);
      }
    }

    if (!hasParam(href, 'aff_unique2')) {
      var sessionId = getGA4SessionIdFromCookie();
      if (sessionId) {
        params.push('aff_unique2=' + encodeURIComponent(sessionId));
        console.log('GTM: Added session_id from cookie:', sessionId);
      }
    }

    // Add timestamp if missing
    if (!hasParam(href, 'aff_unique4')) {
      params.push('aff_unique4=' + encodeURIComponent(Date.now()));
    }

    // Add page path if missing
    if (!hasParam(href, 'aff_sub2')) {
      params.push('aff_sub2=' + encodeURIComponent(pagePath));
    }

    // Add A/B test if available and missing
    if (sub_id3 && !hasParam(href, 'aff_sub3')) {
      params.push('aff_sub3=' + encodeURIComponent(sub_id3));
    }

    // Add Yep S2 if available and missing
    if (s2 && !hasParam(href, 'aff_click_id')) {
      params.push('aff_click_id=' + encodeURIComponent(s2));
    }

    // Add Yep pub_id if available and missing
    if (pub_id && !hasParam(href, 'aff_sub4')) {
      params.push('aff_sub4=' + encodeURIComponent(pub_id));
    }

    // Add Yep sub_id if available and missing
    if (sub_id && !hasParam(href, 'aff_sub5')) {
      params.push('aff_sub5=' + encodeURIComponent(sub_id));
    }

    // Update the link if needed
    if (params.length > 0) {
      var separator = href.indexOf('?') === -1 ? '?' : '&';
      target.href = href + separator + params.join('&');
      console.log('GTM: Click handler added missing parameters:', params.join('&'));
      console.log('GTM: Final click URL:', target.href);
    } else {
      console.log('GTM: Click handler - all parameters already present');
    }
  }, true); // Use capture phase

  console.log('GTM: Click handler active (capture phase)');

  console.log('GTM: ===== DECORATION SUMMARY =====');
  console.log('GTM: Initial links decorated:', initialCount);
  console.log('GTM: Track Label: (read from data-track-label per link)', '(aff_sub)');
  console.log('GTM: GA4 Client ID:', (analyticsData && analyticsData.client_id) || 'Not available (will use cookie fallback on click)', '(aff_unique1)');
  console.log('GTM: GA4 Session ID:', (analyticsData && analyticsData.session_id) || 'Not available (will use cookie fallback on click)', '(aff_unique2)');
  console.log('GTM: GA4 User ID:', (analyticsData && analyticsData.user_id) || 'Not set', '(aff_unique3)');
  console.log('GTM: Timestamp: (generated per link)', '(aff_unique4)');
  console.log('GTM: Yep S2:', s2 || 'Not set', '(aff_click_id)');
  console.log('GTM: Page Path:', pagePath, '(aff_sub2)');
  console.log('GTM: A/B Test:', sub_id3 || 'Not set', '(aff_sub3)');
  console.log('GTM: Yep Pub ID:', pub_id || 'Not set', '(aff_sub4)');
  console.log('GTM: Yep Sub ID:', sub_id || 'Not set', '(aff_sub5)');
  console.log('GTM: ===== THREE-LAYER DECORATION ACTIVE =====');
  console.log('GTM: 1. Initial decoration complete');
  console.log('GTM: 2. MutationObserver watching for dynamic links');
  console.log('GTM: 3. Click handler ready for GA4 cookie fallback');
  console.log('GTM: Script initialization complete');
})();
</script>