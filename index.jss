// Set to true to redirect HTTP connections to HTTPS (only if HTTPS is enabled)
var forceHttps = true;

// Set to true if you want to use the full source-code (slow)
// Set to false if you want to use the minimized source-code (fast)
var developmentMode = true;

// Handles (1) the initial index page request, (2) file downloads, (3) file uploads
function processRequest() {
    // make sure we're HTTPS
    if (forceHttps && request.uri.indexOf("http:") === 0) {
        if (system.site.httpsEnabled) {
            response.redirectUrl = request.uri.replace("http:", "https:");
            return;
        } else
            console.warn("Cannot redirect to HTTPS because HTTPS is not enabled on this site.")
    }
    if (request.form.destination) {  // file upload (CompleteFTP will manage this)
        return { success: true};
    } else if (request.query.download) {  // file download
        system.checkLogin();
        response.downloadFile = system.user.homeFolder + request.query.download;
        response.forceDownload = true;
    } else {  // show file-manager
        response.writeUsingTemplateFile("template.html", {
            developmentMode: developmentMode
        });
    }
}

function login(username, password) {
    try {
        system.login(username, password);
    } catch (err) {
        console.error("Login failed: " + err);
        throw err;
    }
}

function logout() {
    try {
        system.logout();
    } catch (err) {
        console.error("Logout failed: " + err);
        throw err;
    }
}

// Returns general information
function getInfo() {
    system.checkLogin();
    return {
        serverName: system.server.name,
        siteName: system.site.name,
        welcomeMessage: system.site.welcomeMessage,
        userName: system.user.userName,
        homeFolder: system.user.apparentHomeFolder,
        sharingEnabled: system.site.sharingEnabled && system.user.sharingEnabled
    };
}

function exists(filesPaths) {
    system.checkLogin();
    var existingFiles = [];
    filesPaths.forEach(function(f) {
        if (!f)
            continue;
        if (f[0] != '/')
            f = '/' + f;
        var file = system.getFile(system.user.homeFolder + f);
        if (file.exists())
            existingFiles.push(file.fullPath);
    });
    return existingFiles;
}

// Returns a list of the given directory
function list(path, fileExtensions) {
    system.checkLogin();
    var items = [];
    var folder = system.getFile(system.user.homeFolder + path);
    if (!folder.exists())
        throw "error_file_not_found";
    if (!folder.isFolder)
        throw "error_not_folder";
    var files = folder.getFiles();
    for (var i in files) {
        var file = files[i];
        items.push({
            name: file.name,
            rights: "drwxr-xr-x",
            size: file.length,
            date: file.modifiedTime.toUTCString(),
            type: file.isFile ? "file" : "dir"
        })
    }
    return {
        canWrite: folder.canWrite,
        canRemove: folder.canRemove,
        canRename: folder.canRename,
        files: items
    };
}

// Copies files
function share(paths) {
    system.checkLogin();
    var urls = [];
    paths.forEach(function(path) {
        console.log("1");
        // call ListShares to ensure the Shares folder has been created
        system.executeCustomCommand("ShareAPI.ListShares", [""]);
        console.log("2");

        var file = system.getFile(system.user.homeFolder + path);
        console.log("3");
        var sharePath = system.user.homeFolder + "/Shares/" + file.name;
        console.log("4");
        file.copyTo(sharePath);
        console.log("5");

        var jsonResponse = system.executeCustomCommand("ShareAPI.ShareFile", [file.name, file.length]);
        console.log("6");
        var response = JSON.parse(jsonResponse)
        console.log("7");
        urls.push({ name: file.name, url: response.result });
        console.log("8");
    });
    return urls;
}

// Copies files
function copy(paths, toPath, singleFilename, overwrite) {
    return moveOrCopy(false, paths, toPath, singleFilename, overwrite);
}

// Moves files
function move(paths, toPath, overwrite) {
    return moveOrCopy(true, paths, toPath, null, overwrite);
}

// Moves or copies files
function moveOrCopy(move, paths, toPath, singleFilename, overwrite) {
    system.checkLogin();
    try {
        if (singleFilename && paths.length > 1)
            throw "Can't move/copy multiple files/folders to one target";

        var filePairs = [];
        paths.forEach(function(fromPath) {
            var fromFile = system.getFile(system.user.homeFolder + fromPath);
            var toFullPath = system.user.homeFolder + toPath;
            if (toFullPath[toFullPath.length - 1] != '/')
                toFullPath += '/';
            toFullPath += (singleFilename ? singleFilename : fromFile.name);
            var toFile = system.getFile(toFullPath);
            if (overwrite && isAncestor(toFile, fromFile))
                throw "Can't overwrite parent folder";
            filePairs.push({
                from: fromFile,
                to: toFile
            });
        });

        if (!overwrite) {
            var existing = [];
            filePairs.forEach(function(filePair) {
                if (filePair.to.exists())
                    existing.push(filePair.to.fullPath);
            });
            if (existing.length == 1)
                throw "File/folder already exists";
            else if (existing.length > 1)
                throw "Files/folders already exist";
        }

        filePairs.forEach(function(filePair) {
            if (filePair.to.exists())
                filePair.to.remove();
            var operation = filePair.from[move ? "moveTo" : "copyTo"]
            operation(filePair.to.fullPath);
        });
        return { success: true, error: null };
    } catch (e) {
        console.error(typeof(e));
        return { success: false, error: e };
    }
}

// returns true if the parent is an ancestor of the child
function isAncestor(parent, child) {
    while (child.getParent().fullPath != "/") {
        child = child.getParent();
        if (child.fullPath == parent.fullPath)
            return true;
    }
    return false;
}

// Deletes a file
function remove(paths) {
    system.checkLogin();
    try {
        for (var i in paths) {
            var path = paths[i];
            var file = system.getFile(system.user.homeFolder + path);
            file.remove();
        }
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

// this handles the upload by returning the path at which the file should be placed
function getUploadPath(fileName, contentType) {
    system.checkLogin();
    var filePath = system.user.homeFolder + request.form.destination + "/" + fileName;
    var file = system.getFile(filePath);
    var folder = file.getParent();
    if (!folder.exists())
        folder.createFolder();
    console.log("Uploading " + fileName + " to " + folder.fullPath);
    return filePath;
}

// Returns the contents of a file
function getContent(path) {
    system.checkLogin();
    var file = system.getFile(system.user.homeFolder + path);
    return file.readText(content);
}

// Writes the given content to a file
function edit(path, content) {
    system.checkLogin();
    try {
        var file = system.getFile(system.user.homeFolder + path);
        file.writeText(content);
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

// Renames a file
function rename(fromPath, toPath) {
    system.checkLogin();
    try {
        var file = system.getFile(system.user.homeFolder + fromPath);
        file.moveTo(system.user.homeFolder + toPath);
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

// Creates a new folder
function createFolder(path) {
    system.checkLogin();
    try {
        var file = system.getFile(system.user.homeFolder + path);
        file.createFolder();
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

// Creates a new folder
function createFile(path, content) {
    system.checkLogin();
    try {
        var file = system.getFile(system.user.homeFolder + path);
        file.createFile();
        if (content)
            file.writeText(content);
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

function padNumber(i) {
    return i < 10 ? "0" + i : i;
}