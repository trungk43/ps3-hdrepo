/**
 * HDrepo plugin for Showtime 
 *
 */


(function(plugin) {
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;

    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true,
               plugin.path + "logo.png");
                           
    var settings = plugin.createSettings(plugin_info.title,
                    plugin.path + "logo.png",
                    plugin_info.synopsis);

    settings.createDivider('HDrepo');

	settings.createString("login_useremail", "User email", "", function(v) { service.login_useremail = v; });
	settings.createString("login_password", "Password", "", function(v) { service.login_password = v; });
	settings.createString("url_refe", "Refer", "https://www.fshare.vn/index.php", function(v) { service.url_refe = v; });

    function startPage(page) {  
        var dataLogin = { section: "general" };
        page.appendItem(PREFIX + ':login:' + escape(showtime.JSONEncode(dataLogin)),"directory", {title: "Login"});
		
		var post = "provider=root&param=";
		var url='http://feed.hdrepo.com/v1/feed.php';
		var data = showtime.httpPost(url, post, {}, {
			"Connection":"keep-alive",
			"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"User-Agent":"Python-urllib/1.17",
			"Content-Type": "application/x-www-form-urlencoded"
		}).toString();
		
		var myhd=eval(data);

		for (var index in myhd){
			var hd = myhd[index];
			if (hd.type.indexOf("fshare_folder")==0){
				var dataLogin = {provider: hd.provider, param: hd.param, start: '0'};
				page.appendItem(PREFIX + ':hdrepo:' + escape(showtime.JSONEncode(dataLogin)),"directory", {title: hd.title});
			}
			else if (hd.type.indexOf("fshare_file")==0){
				page.appendItem(PREFIX + ':play:' + escape(hd.param), "video", {
					title: hd.title,
					icon: hd.thumb,
					description: hd.desc
				});
			} else {
				try {
					if (hd.start !== undefined){
						var dataLogin = {provider: hd.provider, param: hd.param, start: hd.start};
						page.appendItem(PREFIX + ':hdrepo:' + escape(showtime.JSONEncode(dataLogin)),"directory", {title: hd.title});
					} else {
						var dataLogin = {provider: hd.provider, param: hd.param, start: 0};
						page.appendItem(PREFIX + ':hdrepo:' + escape(showtime.JSONEncode(dataLogin)),"directory", {title: hd.title});
					}
				}
				catch (err) {
					showtime.trace('Search: ' + err, "HDrepo")
				}
			}
		}
		
		page.loading = false;
		
		page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.metadata.logo = plugin.path + "logo.png";
    
        page.metadata.title = "HDrepo";
    }

	//pageControllerhdrepo
    function pageControllerHDrepo(page, loader) {
        function paginator() {
			var data = loader();

			//var myhd=showtime.JSONDecode(data);
			var myhd=eval(data);
			page.entries = 0;

			for (var index in myhd){
				page.entries++;
				
				var hd = myhd[index];
				if (hd.type.indexOf("fshare_folder")==0){
					var dataLogin = {provider: hd.provider, param: hd.param, start: '0'};
					page.appendItem(PREFIX + ':hdrepo:' + escape(showtime.JSONEncode(dataLogin)),"directory", {
						title: hd.title,
                        icon: hd.thumb,
						description: hd.desc
					});
				}
				else if (hd.type.indexOf("fshare_file")==0){
					page.appendItem(PREFIX + ':play:' + escape(hd.param), "video", {
						title: hd.title,
                        icon: hd.thumb,
						description: hd.title + "\n"+ hd.desc
					});
				} else {
					try {
						if (hd.start !== undefined){
							var dataLogin = {provider: hd.provider, param: hd.param, start: hd.start};
							page.appendItem(PREFIX + ':hdrepo:' + escape(showtime.JSONEncode(dataLogin)),"directory", {
								title: hd.title,
								icon: hd.thumb,
								description: hd.desc
							});
						} else {
							var dataLogin = {provider: hd.provider, param: hd.param, start: 0};
							page.appendItem(PREFIX + ':hdrepo:' + escape(showtime.JSONEncode(dataLogin)),"directory", {
								title: hd.title,
								icon: hd.thumb,
								description: hd.desc
							});
						}
					}
					catch (err) {
						showtime.trace('Search: ' + err, "HDrepo")
					}
				}
			}
			
			page.loading = false;

            return false;
        }

        page.type = "directory";
        page.contents = "items";
        paginator();
        //page.paginator = paginator;
    }
	
    plugin.addURI(PREFIX + ":hdrepo:(.*)", function(page, data) {
        try {
			data = showtime.JSONDecode(unescape(data));
            pageControllerHDrepo(page, function() {
				var post = "provider=" + data.provider + "&param=" + data.param + "&start=" + data.start;
				var url='http://feed.hdrepo.com/v1/feed.php';
                return showtime.httpPost(url, post, {}, {
					"Connection":"keep-alive",
					"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
					"User-Agent":"Python-urllib/1.17",
					"Content-Type": "application/x-www-form-urlencoded"
				}).toString();
            });
        }
        catch (err) {
            showtime.trace('Search: ' + err, "HDrepo")
        }
		

        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.metadata.logo = plugin.path + "logo.png";
    
        page.metadata.title = "hdrepo " + data.provider;
    });	

    plugin.addURI(PREFIX + ":login:(.*)", function(page, data) {
        var url = "";
		var post="login_useremail="+service.login_useremail+"&login_password="+service.login_password+"&url_refe="+service.url_refe+"";

		//showtime.message('Start login ' + post, true, false);

		var login = showtime.httpPost("https://www.fshare.vn/login.php", post, {}, {
			"Host":"www.fshare.vn",
			"Referer":"https://www.fshare.vn/index.php",
			"Connection":"keep-alive",
			"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"User-Agent":"Mozilla/5.0 (Windows NT 6.2; WOW64; rv:18.0) Gecko/20100101 Firefox/18.0",
			"Content-Type": "application/x-www-form-urlencoded"
		});
		
		var headers = '';
		for (var str in login.multiheaders['Set-Cookie']){
			headers += login.multiheaders['Set-Cookie'][str]+';'
		}

        showtime.message('Login headers: ' + headers, true, false);

        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.metadata.logo = plugin.path + "logo.png";
    
        page.metadata.title = "HDrepo";
		
    });
	
    plugin.addURI(PREFIX + ":play:(.*)", function (page, url) {
        url = unescape(url);

        var videoParams = {
            sources: [{
                url: url
            }]
        };

        page.source = "videoparams:" + showtime.JSONEncode(videoParams);
        page.type = "video";

        page.loading = false;
    });
	
    plugin.addSearcher("HDrepo", plugin.path + "logo.png",
    function (page, query) {
        try {
            pageControllerHDrepo(page, function() {
				var post = "provider=search4" + "&param=" + encodeURIComponent(query.replace(' ','%20'));
				var url='http://feed.hdrepo.com/v1/feed.php';
                return showtime.httpPost(url, post, {}, {
					"Connection":"keep-alive",
					"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
					"User-Agent":"Python-urllib/1.17",
					"Content-Type": "application/x-www-form-urlencoded"
				}).toString();
            });
        }
        catch (err) {
            showtime.trace('Search: ' + err, "HDrepo")
        }
    });

plugin.addURI("HDrepo:start", startPage);
})(this);