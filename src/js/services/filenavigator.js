(function(angular) {
    'use strict';
    angular.module('FileManagerApp').service('fileNavigator', [
        'apiMiddleware', 'fileManagerConfig', 'item', '$window', function (ApiMiddleware, fileManagerConfig, Item, $window) {

        var FileNavigator = function(authenticationErrorHandler) {
            this.authenticationErrorHandler = authenticationErrorHandler;
            this.apiMiddleware = new ApiMiddleware(authenticationErrorHandler);
            this.requesting = false;
            this.fileList = [];
            this.canUpload = false;
            this.canRename = false;
            this.canRemove = false;
            this.currentPath = this.getBasePath();
            this.history = [];
            this.error = '';
            this.homeFolder = '';
            this.userName = '';
            this.sharingEnabled = false;
            this.overwrite = false;

            this.onRefresh = function() {};
        };

        FileNavigator.prototype.getBasePath = function() {
            var path = (fileManagerConfig.basePath || '').replace(/^\//, '');
            return path.trim() ? path.split('/') : [];
        };

        FileNavigator.prototype.deferredHandler = function(response, deferred, code, defaultMsg, headers) {
            var data = response.data;
            this.error = null;
            if (!!headers && !!headers['x-completeftp-login']) {
                this.authenticationErrorHandler();
                return;
            }
            if (!data || typeof data !== 'object')
                this.error = 'Error %s - Server connection lost.'.replace('%s', code);
            if (this && !this.error && code === 404)
                this.error = 'Error 404 - Server file-manager not found.';
            if (this && !this.error && code === 200 && !data.error)
                this.error = null;
            if (this && !this.error && data.result && data.result.error)
                this.error = data.result.error;
            if (this && !this.error && data.error) {
                this.error = data.error.message;
                if (data.error.code === 1)
                    this.authenticationErrorHandler();
            }
            if (this && !this.error && defaultMsg)
                this.error = defaultMsg;
            if (this && this.error)
                return deferred.reject(data);
            else
                return deferred.resolve(data);
        };

        FileNavigator.prototype.getInfo = function() {
            return this.apiMiddleware.getInfo(this.deferredHandler.bind(this));
        };

        FileNavigator.prototype.list = function() {
            return this.apiMiddleware.list(this.currentPath, this.deferredHandler.bind(this));
        };

        FileNavigator.prototype.refresh = function() {
            var self = this;
            if (! self.currentPath.length) {
                self.currentPath = this.getBasePath();
            }
            var path = self.currentPath.join('/');
            self.requesting = true;
            self.fileList = [];
            var info;
            return self.getInfo()
                .then(
                    function(data) {
                        info = data.result;
                        this.homeFolder = info.homeFolder;
                        this.userName = info.userName;
                        this.sharingEnabled = info.sharingEnabled;
                        return self.list();
                    }.bind(this), 
                    function(data) {
                        if (typeof(data)=='string') // happens when RPC was redirected to /Login
                            $window.location.href = '/Login';
                        else
                            this.authenticationErrorHandler();
                    }.bind(this))
                .then(
                    function(data) {
                        self.canUpload = (data && data.result && data.result.canWrite || false);
                        self.canRemove = (data && data.result && data.result.canRemove || false);
                        self.canRename = (data && data.result && data.result.canRename || false);
                        var files = (data && data.result && data.result.files || []);
                        self.fileList = files.map(function(file) {
                            return new Item(file, self.currentPath);
                        });
                        self.buildTree(path);
                        self.onRefresh();
                    })
                .finally(
                    function() {
                        self.requesting = false;
                    });
        };
        
        FileNavigator.prototype.buildTree = function(path) {
            var flatNodes = [], selectedNode = {};

            function recursive(parent, item, path) {
                var absName = path ? (path + '/' + item.model.name) : item.model.name;
                if (parent.name && parent.name.trim() && path.trim().indexOf(parent.name) !== 0) {
                    parent.nodes = [];
                }
                if (parent.name !== path) {
                    parent.nodes.forEach(function(nd) {
                        recursive(nd, item, path);
                    });
                } else {
                    for (var e in parent.nodes) {
                        if (parent.nodes[e].name === absName) {
                            return;
                        }
                    }
                    parent.nodes.push({item: item, name: absName, nodes: []});
                }
                
                parent.nodes = parent.nodes.sort(function(a, b) {
                    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() === b.name.toLowerCase() ? 0 : 1;
                });
            }

            function flatten(node, array) {
                array.push(node);
                for (var n in node.nodes) {
                    flatten(node.nodes[n], array);
                }
            }

            function findNode(data, path) {
                return data.filter(function (n) {
                    return n.name === path;
                })[0];
            }

            //!this.history.length && this.history.push({name: '', nodes: []});
            !this.history.length && this.history.push({ name: this.getBasePath()[0] || '', nodes: [] });
            flatten(this.history[0], flatNodes);
            selectedNode = findNode(flatNodes, path);
            selectedNode && (selectedNode.nodes = []);

            for (var o in this.fileList) {
                var item = this.fileList[o];
                item instanceof Item && item.isFolder() && recursive(this.history[0], item, path);
            }
        };

        FileNavigator.prototype.folderClick = function(item) {
            this.currentPath = [];
            if (item && item.isFolder())
                this.currentPath = item.model.fullPath().split('/').splice(1);
            this.refresh();
        };

        FileNavigator.prototype.upDir = function() {
            if (this.currentPath[0]) {
                this.currentPath = this.currentPath.slice(0, -1);
                this.refresh();
            }
        };

        FileNavigator.prototype.goTo = function(index) {
            this.currentPath = this.currentPath.slice(0, index + 1);
            this.refresh();
        };

        FileNavigator.prototype.fileNameExists = function(fileName) {
            return this.fileList.find(function(item) {
                return fileName && item.model.name.trim() === fileName.trim();
            });
        };

        FileNavigator.prototype.listHasFolders = function() {
            return this.fileList.find(function(item) {
                return item.model.type === 'dir';
            });
        };

        FileNavigator.prototype.getCurrentFolderName = function() {
            return this.currentPath.slice(-1)[0] || '/';
        };

        return FileNavigator;
    }]);
})(angular);
