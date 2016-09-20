(function() {
	'use strict';

	var Util = {
		q: function(query, context) {
			return (context || document).querySelector(query);
		},
		qq: function(query, context) {
			return [].slice.call((context || document).querySelectorAll(query));
		},
		openOpenDialog: function(cb, accept) {
			var tempDiv = document.createElement('div');
			var input = document.createElement('input');
			input.setAttribute('type', 'file');
			if (accept) input.setAttribute('accept', accept);
			tempDiv.appendChild(input);
			input = Util.q('input', tempDiv);
			input.onchange = function(e) {
				var files = input.files;
				if (files.length > 0) {
					cb(files[0]);
				}
			};
			input.click();
		},
		icon: function(name, size) {
			var icon = document.createElement('i');
			icon.classList.add('material-icons');
			if (size) {
				icon.classList.add(size);
			}
			icon.textContent = name;
			return icon;
		},
		jshref: 'javascript:void(0)'
	};

	var File = {
		parseFile: function(xml) {
			var match = xml.match(/<STARTSUBSNEW\.xml>((?:.|\n)+)\nEND>/);
			if (!match) return null;
			xml = match[1];

			var parser = new DOMParser();
			var dom = parser.parseFromString(xml, 'text/xml');
			if (dom.documentElement.nodeName !== 'map') return null;

			return Util.qq('string:not([name="subhistory"])', dom).map(function(node) {
				return {
					name: node.getAttribute('name'),
					subs: node.textContent.split(',')
				};
			});
		},
		init: function(data) {

		},
		open: function(cb) {
			Util.openOpenDialog(function(file) {
				var reader = new FileReader();
				reader.onload = function() {
					try {
						var parsed = File.parseFile(reader.result);
						if (parsed) {
							cb(null, {
								filename: file.name,
								raw: reader.result,
								users: parsed
							});
						} else {
							throw 'Invalid File';
						}
					} catch(e) {
						cb(e);
					}
				};
				reader.readAsText(file);
			}, '.txt');
		},
		save: function(data) {
			var raw = data.raw;
			data.users.forEach(function(user) {
				raw = raw.replace(new RegExp('(<STARTSUBSNEW\.xml>(?:.|\n)+<string name="' + user.name + '">).*(</string>)'), '$1' + user.subs.join(',') + '$2');
			});
			var blob = new Blob([raw], {type: "text/plain;charset=utf-8"});
			saveAs(blob, data.filename);
		}
	};

	var App = {
		data: null,
		tabsContainer: Util.q('#tabs'),
		subsContainer: Util.q('#subs'),
		init: function(data) {
			App.data = data;
			App.tabsContainer.innerHTML = '';
			App.subsContainer.innerHTML = '';
			var tabs = document.createElement('ul');
			tabs.classList.add('tabs');
			data.users.forEach(function(user) {
				var tab = document.createElement('li');
				tab.classList.add('tab');
				var tabLink = document.createElement('a');
				tabLink.textContent = user.name;
				tab.appendChild(tabLink);
				tabs.appendChild(tab);

				tabLink.onclick = function(e) {
					App.loadUser(user.name);
				};
			});
			App.tabsContainer.appendChild(tabs);
			$(tabs).tabs();

			Util.q('li.tab > a', tabs).click();
		},
		sort: function(sortable, user, id) {
			try {
				alert('sort');
				var order = sortable.toArray();
				var index = id ? order.indexOf(id) : 0;
				var itemsToSort = order.slice(index);
				itemsToSort = itemsToSort.sort(function(a, b) {
					return a.localeCompare(b, 'en', {'sensitivity': 'base'});
				});
				['all', 'frontpage'].forEach(function(sub) {
					var theIndex = itemsToSort.indexOf(sub);
					if (theIndex > 0) {
						itemsToSort.splice(theIndex, 1);
						itemsToSort.splice(0, 0, sub);
					}
				});
				order.splice(index, itemsToSort.length);
				order = order.concat(itemsToSort);
				sortable.sort(order);
				user.subs = order;
			} catch (e) {
				alert(e);
			}
		},
		loadUser: function(name) {
			console.log('Loading ' + name);
			App.subsContainer.innerHTML = '';
			var user;
			App.data.users.some(function(theUser) {
				if (theUser.name === name) {
					user = theUser;
					return true;
				}
			});
			if (user) {
				var sortable;
				var subList = document.createElement('ul');
				subList.classList.add('collection');
				user.subs.forEach(function(subName) {
					var sub = document.createElement('li');
					sub.classList.add('collection-item');
					sub.dataset.id = subName;
					var handle = Util.icon('reorder');
					handle.classList.add('handle', 'left');
					sub.appendChild(handle);
					sub.appendChild(document.createTextNode(subName));
					subList.appendChild(sub);
					sub.onclick = function(e) {
						sub.classList.toggle('active');
					};
					var sortButton = document.createElement('a');
					sortButton.href = Util.jshref;
					sortButton.classList.add('right');
					sortButton.appendChild(Util.icon('sort_by_alpha'));
					sub.appendChild(sortButton);
					sortButton.onclick = function(e) {
						alert('click');
						e.stopImmediatePropagation();
						App.sort(sortable, user, sub.dataset.id);
					};
				});
				App.subsContainer.appendChild(subList);
				sortable = Sortable.create(subList, {
					handle: '.handle',
					onEnd: function(e) {
						var sub = user.subs[e.oldIndex];
						user.subs.splice(e.oldIndex, 1);
						user.subs.splice(e.newIndex, 0, sub);
					}
				});
			}
		},
		save: function() {
			if (App.data) {
				File.save(App.data);
			}
		}
	};

	Util.q('#load').onclick = function(e) {
		File.open(function(err, data) {
			if (err) return console.error(err);
			App.init(data);
		});
	};

	Util.q('#save').onclick = App.save;
})();