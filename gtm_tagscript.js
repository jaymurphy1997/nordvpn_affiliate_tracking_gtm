<script>
(function() {
  console.log('GTM: Affiliate Link Decoration Script Started');
  
  // Get Analytics Data
  var analyticsData = {{Analytics data}};
  console.log('GTM: Analytics data:', analyticsData);
  
  if (!analyticsData || !analyticsData.client_id || !analyticsData.session_id) {
    console.log('GTM: No analytics data available - Script terminated');
    return;
  }
  
  console.log('GTM: Analytics validated - client_id:', analyticsData.client_id, 'session_id:', analyticsData.session_id);
  
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
  
  // ===== GET PAGE PATH =====
  var pagePath = window.location.pathname;
  console.log('GTM: Current page path:', pagePath);
  
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
  var dlAbVariant = {{abVariant}};
  var dlAbTestName = {{abTestName}};

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
  
  var links = document.querySelectorAll('a[href*="go.nordvpn.net"]');
  console.log('GTM: Found', links.length, 'NordVPN links to decorate');
  
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var href = link.href;
    var params = [];
    
    console.log('GTM: Processing link', i + 1, ':', href);
    
    // NOTE: We're keeping existing aff_sub (like y1) - not modifying it
    
    // Add GA4 Client ID (aff_unique1) if not present
    if (!hasParam(href, 'aff_unique1')) {
      params.push('aff_unique1=' + encodeURIComponent(analyticsData.client_id));
    }
    
    // Add GA4 Session ID (aff_unique2) if not present
    if (!hasParam(href, 'aff_unique2')) {
      params.push('aff_unique2=' + encodeURIComponent(analyticsData.session_id));
    }
    
    // Add GA4 User ID (aff_unique3) if available and not present
    if (analyticsData.user_id && !hasParam(href, 'aff_unique3')) {
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
    
    // Add Page Path (aff_sub2) if not present - NordVPN expects this here
    // JHM update 11/10/25 - replace the "/" in the page path with URL encoding safe underscores "_"
    if (!hasParam(href, 'aff_sub2')) {
      params.push('aff_sub2=' + encodeURIComponent(pagePath.replace(/\//g, '_')));
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
      console.log('GTM: ✓ Link', i + 1, 'decorated with:', params.join('&'));
      console.log('GTM: ✓ Final URL:', link.href);
    } else {
      console.log('GTM: ○ Link', i + 1, 'skipped - all parameters already present');
    }
  }
  
  console.log('GTM: ===== DECORATION SUMMARY =====');
  console.log('GTM: Total NordVPN links processed:', links.length);
  console.log('GTM: GA4 Client ID:', analyticsData.client_id, '(aff_unique1)');
  console.log('GTM: GA4 Session ID:', analyticsData.session_id, '(aff_unique2)');
  console.log('GTM: GA4 User ID:', analyticsData.user_id || 'Not set', '(aff_unique3)');
  console.log('GTM: Timestamp:', Date.now(), '(aff_unique4)');
  console.log('GTM: Yep S2:', s2 || 'Not set', '(aff_click_id)');
  console.log('GTM: Page Path:', pagePath, '(aff_sub2)');
  console.log('GTM: A/B Test (sub_id3):', sub_id3 || 'Not set', '(aff_sub3)');
  console.log('GTM: Yep Pub ID:', pub_id || 'Not set', '(aff_sub4)');
  console.log('GTM: Yep Sub ID:', sub_id || 'Not set', '(aff_sub5)');
  console.log('GTM: Note: aff_sub keeps its original value (e.g., y1)');
  console.log('GTM: Script completed successfully');
})();
</script>