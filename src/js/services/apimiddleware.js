(function(angular) {
    'use strict';
    angular.module('FileManagerApp').service('apiMiddleware', ['$window', 'fileManagerConfig', 'apiHandler', 
        function ($window, fileManagerConfig, ApiHandler) {

        var ApiMiddleware = function(authenticationErrorHandler) {
            this.authenticationErrorHandler = authenticationErrorHandler;
            this.apiHandler = new ApiHandler(authenticationErrorHandler);
        };

        ApiMiddleware.prototype.getPath = function(arrayPath) {
            return '/' + arrayPath.join('/');
        };

        ApiMiddleware.prototype.getFileList = function(files) {
            return (files || []).map(function(file) {
                return file && file.model.fullPath();
            });
        };

        ApiMiddleware.prototype.getFilePath = function(item) {
            return item && item.model.fullPath();
        };

        ApiMiddleware.prototype.getInfo = function(customDeferredHandler) {
            return this.apiHandler.getInfo(fileManagerConfig.getInfoUrl, customDeferredHandler);
        };

        ApiMiddleware.prototype.exists = function(files, path, customDeferredHandler) {
            return this.apiHandler.exists(fileManagerConfig.existsUrl, files, path, customDeferredHandler);
        };

        ApiMiddleware.prototype.list = function(path, customDeferredHandler) {
            return this.apiHandler.list(fileManagerConfig.listUrl, this.getPath(path), customDeferredHandler);
        };

        ApiMiddleware.prototype.share = function(files, password, customDeferredHandler) {
            return this.apiHandler.share(fileManagerConfig.shareUrl, files, password, customDeferredHandler);
        };

        ApiMiddleware.prototype.copy = function(files, path, overwrite) {
            var items = this.getFileList(files);
            var singleFilename = items.length === 1 ? files[0].tempModel.name : undefined;
            return this.apiHandler.copy(fileManagerConfig.copyUrl, items, this.getPath(path), singleFilename, overwrite);
        };

        ApiMiddleware.prototype.move = function(files, path, overwrite) {
            var items = this.getFileList(files);
            return this.apiHandler.move(fileManagerConfig.moveUrl, items, this.getPath(path), overwrite);
        };

        ApiMiddleware.prototype.remove = function(files) {
            var items = this.getFileList(files);
            return this.apiHandler.remove(fileManagerConfig.removeUrl, items);
        };

        ApiMiddleware.prototype.upload = function(files, path, overwrite) {
            if (! $window.FormData) {
                throw new Error('Unsupported browser version');
            }
            var self = this;
            var destination = self.getPath(path);
            var doUpload = function() {
                return self.apiHandler.upload(fileManagerConfig.uploadUrl, destination, files);
            };

            if (overwrite)
                return doUpload();
            else
                return self.exists(files, destination).then(function(data) {
                    var existingFiles = data.result;
                    if (existingFiles && existingFiles.length > 0)
                        throw { code: 'error_files_exist', data: existingFiles };

                    return doUpload();
                });
        };

        ApiMiddleware.prototype.getContent = function(item) {
            var itemPath = this.getFilePath(item);
            return this.apiHandler.getContent(fileManagerConfig.getContentUrl, itemPath);
        };

        ApiMiddleware.prototype.edit = function(item) {
            var itemPath = this.getFilePath(item);
            return this.apiHandler.edit(fileManagerConfig.editUrl, itemPath, item.tempModel.content);
        };

        ApiMiddleware.prototype.rename = function(item) {
            var itemPath = this.getFilePath(item);
            var newPath = item.tempModel.fullPath();

            return this.apiHandler.rename(fileManagerConfig.renameUrl, itemPath, newPath);
        };

        ApiMiddleware.prototype.getUrl = function(item) {
            var itemPath = this.getFilePath(item);
            return this.apiHandler.getUrl(fileManagerConfig.downloadFileUrl, itemPath);
        };

        ApiMiddleware.prototype.download = function(item, forceNewWindow) {
            //TODO: add spinner to indicate file is downloading
            var itemPath = this.getFilePath(item);
            var toFilename = item.model.name;

            if (item.isFolder()) {
                toFilename += '.zip';
                itemPath += '.zip';
            }
            
            return this.apiHandler.download(
                fileManagerConfig.downloadFileUrl, 
                itemPath,
                toFilename,
                fileManagerConfig.downloadFilesByAjax,
                forceNewWindow
            );
        };

        ApiMiddleware.prototype.downloadMultiple = function(files, forceNewWindow) {
            var items = this.getFileList(files);
            var timestamp = new Date().getTime().toString().substr(8, 13);
            var toFilename = timestamp + '-' + fileManagerConfig.multipleDownloadFileName;
            
            return this.apiHandler.downloadMultiple(
                fileManagerConfig.downloadMultipleUrl, 
                items, 
                toFilename, 
                fileManagerConfig.downloadFilesByAjax,
                forceNewWindow
            );
        };

        ApiMiddleware.prototype.compress = function(files, compressedFilename, path) {
            var items = this.getFileList(files);
            return this.apiHandler.compress(fileManagerConfig.compressUrl, items, compressedFilename, this.getPath(path));
        };

        ApiMiddleware.prototype.extract = function(item, folderName, path) {
            var itemPath = this.getFilePath(item);
            return this.apiHandler.extract(fileManagerConfig.extractUrl, itemPath, folderName, this.getPath(path));
        };

        ApiMiddleware.prototype.changePermissions = function(files, dataItem) {
            var items = this.getFileList(files);
            var code = dataItem.tempModel.perms.toCode();
            var octal = dataItem.tempModel.perms.toOctal();
            var recursive = !!dataItem.tempModel.recursive;

            return this.apiHandler.changePermissions(fileManagerConfig.permissionsUrl, items, code, octal, recursive);
        };

        ApiMiddleware.prototype.createFolder = function(item) {
            var path = item.tempModel.fullPath();
            return this.apiHandler.createFolder(fileManagerConfig.createFolderUrl, path);
        };

        ApiMiddleware.prototype.createFile = function(item) {
            var path = item.tempModel.fullPath();
            var content = item.tempModel.content;
            return this.apiHandler.createFile(fileManagerConfig.createFileUrl, path, content);
        };
        
        ApiMiddleware.prototype.logout = function(item) {
            return this.apiHandler.logout(fileManagerConfig.logoutUrl);
        };
        
        ApiMiddleware.prototype.login = function(username, password) {
            return this.apiHandler.login(fileManagerConfig.loginUrl, username, password);
        };
        
        ApiMiddleware.prototype.logout = function(item) {
            return this.apiHandler.logout(fileManagerConfig.logoutUrl);
        };

        return ApiMiddleware;

    }]);
})(angular);