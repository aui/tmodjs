window.DEBUG = /DEBUG/.test(function (DEBUG) {});

function App (config) {
    var router = new Router();
    this.router = router;
    this.config = config;
    this.cache = {
        activitys: []
    };

    
};

App.prototype = {
    constructor: App,
    start: function () {
        var that = this;
        this.activityContainer = document.querySelector(this.config.activityContainer);
        this.activityContainer.appendChild(Activity.getContainer());

        this.cache.activitys.forEach(function (args, index) {
            var name = args[0];
            var callback = args[1];

            var activity = new Activity({
                name: args[0]
            });

            var data = {
                name: name,
                activity: activity
            };

            this[index] = data;

            callback.call(that, activity, activity.getContainer(), Activity.getContainer());
        });

        new FastClick(this.activityContainer, function (event) {
            var target = event.target;
            var isLink = /^a$/i.test(target.nodeName);
            if (isLink) {
                location.href = target.href;
                event.preventDefault();
            }
        });

        this.router.trigger();
    },
    addRouter: function (route, callback) {
        this.router.add(route, callback.bind(this));
    },
    triggerRouter: function (route) {
        this.router.trigger(route);
    },
    createActivity: function (name, oncreate) {
        this.cache.activitys.push(arguments);
    }
};



function Activity (config) {
    this.config = config;
    this.create();
};



Activity.currentTask = null;
Activity.tasks = [];

Activity.getContainer = function () {
    var container = document.createElement('div');
    container.className = 'activity-container';
    Activity.getContainer = function () {
        return container;
    };
    return container;
};


Activity.prototype = {

    constructor: Activity,

    className: 'activity',
    status: 'stop',

    duration: 400,

    /**
     * Activity 实例名称
     */
    //name: null,

    //label: null,

    //exported: false,

    /**
     * standard: 这是默认模式，每次激活Activity时都会创建Activity实例，并放入任务栈中。
     * singleTop: 如果在任务的栈顶正好存在该Activity的实例，就重用该实例( 会调用实例的 onNewIntent() )，否则就会创建新的实例并放入栈顶，即使栈中已经存在该Activity的实例，只要不在栈顶，都会创建新的实例。
     * singleTask: 如果在栈中已经有该Activity的实例，就重用该实例(会调用实例的 onNewIntent() )。重用时，会让该实例回到栈顶，因此在它上面的实例将会被移出栈。如果栈中不存在该实例，将会创建新的实例放入栈中。 
     * singleInstance: 在一个新栈中创建该Activity的实例，并让多个应用共享该栈中的该Activity实例。一旦该模式的Activity实例已经存在于某个栈中，任何应用再激活该Activity时都会重用该栈中的实例( 会调用实例的 onNewIntent() )。其效果相当于多个应用共享一个应用，不管谁激活该 Activity 都会进入同一个应用中。
     */
    //launchMode: 'standard',


    // oncreate: function () {},//TODO: 未完成
    // onstart: function () {},
    // onresume: function () {},
    // onpause: function () {},
    // onstop: function () {},
    // onrestart: function () {},
    // ondestroy: function () {},

    create: function () {
        //this.id = Math.random().toString(36).substring(2, 15);
        this._statusClassName = this.className + '-backward';
        this._container = this._createElement();
        this._emit('create');
    },


    start: function () {

        clearTimeout(this._timer);

        if (this.status === 'pause') {
            this.resume();
            return;
        }
        
        this.arguments = arguments;

        if (this.status === 'start') {
            //this.pause();
            //this.stop();
            this._emit('restart');
        }


        this.status = 'start';
        this._emit('start');

        this.resume();
    },


    resume: function () {
        
        var that = this;
        var fromActivity = Activity.currentTask;

        Activity.currentTask = this;
        
        var index = Activity.tasks.indexOf(this);
        var backward = index !== -1;

        if (backward) {
            var removeList = Activity.tasks.splice(index, Activity.tasks.length);
            removeList.forEach(function (activity) {
                if (activity !== that) {
                    activity.destroy();
                }
            });
        }

        Activity.tasks.push(this);

        this._emit('resume');

        this._swipe(fromActivity, backward);
        this._container.focus();
    },


    pause: function () {
        this.status = 'pause';
        this._emit('pause');

        clearTimeout(this._timer);
        this._timer = setTimeout(this.stop.bind(this), this.duration);
    },


    stop: function (code) {
        this.status = 'stop';
        this._emit('stop');
    },


    destroy: function () {
        setTimeout(function () {
            // active 马上要被销毁，回调函数可用来进行一些数据保存的工作
            this._emit('destroy');
        }.bind(this), this.duration);
    },
    

    getContainer: function () {
        return this._container;
    },


    setContent: function (html) {
        this._container.innerHTML = html;
    },


    _emit: function (type) {
        if (this['on' + type]) {
            this['on' + type].apply(this, this.arguments || []);
        }

        if (window.DEBUG) {
            console.log(this.config.name + ': on' + type);
        }
    },
    

    _createElement: function () {
        var duration = this.duration;
        var cssText = 'transition-duration:' + duration + 'ms;';
        var activity = document.createElement('section');

        if (window.DEBUG) {
            activity.setAttribute('data-name', this.config.name); // debug
        }
        
        activity.cssText = cssText + '-webkit-' + cssText;
        activity.className = this.className + ' ' + this._statusClassName;
        activity.zIndex = -1;

        Activity.getContainer().appendChild(activity);

        return activity;
    },


    _position: function (type) {
        this._container.classList.remove(this._statusClassName);
        this._statusClassName = this.className + '-' + type;
        this._container.classList.add(this._statusClassName);
    },


    _swipe: function (fromActivity, backward) {
        if (fromActivity) {
            this._position('show');
            fromActivity._position(backward ? 'backward' : 'forward');
            fromActivity.pause();
        } else {
           this._position('show');
        }
    }
};


function Router () {
    var that = this;
    this.routes = {};
    Router.createEvent(function () {
        return that.trigger();
    });
};

Router.createEvent = function (callback) {
    window.addEventListener
    ? window.addEventListener('hashchange', callback, false)
    : window.attachEvent('on' + 'hashchange', callback); // IE8
};

Router.prototype = {

    constructor: Router,

    /**
     * 添加路由
     * @param {String, RegExp}  表达式
     * @param {Function}        回调函数
     */
    add: function (route, callback) {

        if (typeof route === 'string') {
            route = route
            .replace(/:\w+/g, '([^\/]+)')
            .replace(/\*\w+/g, '(.*?)');

            route = "^" + route + "$";
        } else {
            route = route.toString();
        }

        this.routes[route] = callback;
    },

    /**
     * 主动触发路由事件
     * @param {String, RegExp}  表达式
     */
    trigger: function (param) {
        param = (param || location.href)
        .replace(/^[^#]*#?(.*)$/, '$1');

        var route, callback, params;
        var isEmpty = true;
        var routes = this.routes;
        
        for (route in routes) {
            callback = routes[route];
            route = new RegExp(route);
            if (route.test(param)) {
                isEmpty = false;
                params = route.exec(param).slice(1);

                for (var i = 0; i < params.length; i ++) {
                    params[i] = decodeURIComponent(params[i]);
                }

                callback.apply(this, params);
            }
        }

        if (isEmpty && routes['^404$']) {
            routes['^404$'].call(this);
        }
        
    }

};



var google = {clickbuster:{}};
function FastClick(element, handler) {
    this.element = element;
    this.handler = handler;
    element.addEventListener('touchstart', this, false);
    element.addEventListener('click', this, false);
};

FastClick.prototype.handleEvent = function (event) {

    switch (event.type) {
        case 'touchstart':
            this.onTouchStart(event);
            break;
        case 'touchmove':
            this.onTouchMove(event);
            break;
        case 'touchend':
            this.onClick(event);
            break;
        case 'click':
            this.onClick(event);
            break;
    }
};


//保留对touchStart位置的引用，然后开始监听touchMove和touchEnd事件。调用stopPropagation来保证另一个动作不会再次处理同样的点击事件。
FastClick.prototype.onTouchStart = function (event) {
    event.stopPropagation();

    this.element.addEventListener('touchend', this, false);
    document.body.addEventListener('touchmove', this, false);

    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
};

//当一个touchMove事件被触发，检查用户是否推动超过10px这个阈值。
FastClick.prototype.onTouchMove = function (event) {
    if (Math.abs(event.touches[0].clientX - this.startX) > 10 ||
        Math.abs(event.touches[0].clientY - this.startY) > 10) {
        this.reset();
    }
};

//触发一个实际的click处理函数，如果有touchEnd事件，就阻止幽灵点击事件。
FastClick.prototype.onClick = function (event) {
    event.stopPropagation();
    this.reset();
    this.handler(event);

    if (event.type == 'touchend') {
        google.clickbuster.preventGhostClick(this.startX, this.startY);
    }
};

FastClick.prototype.reset = function () {
    this.element.removeEventListener('touchend', this, false);
    document.body.removeEventListener('touchmove', this, false);
};

//调用preventGhostClick来消除掉所有的在2.5s内且在不超过保留的x，y坐标周围25px的点击事件。
google.clickbuster.preventGhostClick = function (x, y) {
    google.clickbuster.coordinates.push(x, y);
    window.setTimeout(google.clickbuster.pop, 2500);
};

google.clickbuster.pop = function () {
    google.clickbuster.coordinates.splice(0, 2);
};

//如果我们 在给定的范围和时间阈值里捕捉到一个click事件，我们调用stopPropagation和preventDefault。调用preventDefault能够阻止链接变为activated状态。
google.clickbuster.onClick = function (event) {
    for (var i = 0; i < google.clickbuster.coordinates.length; i += 2) {
        var x = google.clickbuster.coordinates[i];
        var y = google.clickbuster.coordinates[i + 1];
        if (Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25) {
            event.stopPropagation();
            event.preventDefault();
        }
    }
};

document.addEventListener('click', google.clickbuster.onClick, true);
google.clickbuster.coordinates = [];


