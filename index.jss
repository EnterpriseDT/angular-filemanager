// Set to true if you want to use the full source-code (slow)
// Set to false if you want to use the minimized source-code (fast)
var developmentMode = true;

// Handles (1) the initial index page request, (2) file downloads, (3) file uploads
function processRequest() {
    // make sure we're HTTPS
    if (request.uri.indexOf("http:") === 0) {
        response.redirectUrl = request.uri.replace("http:", "https:");
        return;
    }
    if (request.form.destination) {  // file upload (CompleteFTP will manage this)
        console.log("request.form.destination = " + request.form.destination);
        return { success: true};
    } else if (request.query.download) {  // file download
        checkLogin();
        response.downloadFile = system.user.homeFolder + request.query.download;
        response.forceDownload = true;
    } else {  // show file-manager
        response.writeUsingTemplateFile("template.html", {
            developmentMode: developmentMode
        });
    }
}

function checkLogin() {
    if (system.user.isAnonymous)
        throw { code: 1, message: "Not logged in" };
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
    checkLogin();
    return {
        serverName: system.server.name,
        siteName: system.site.name,
        welcomeMessage: system.site.welcomeMessage,
        userName: system.user.userName,
        homeFolder: system.user.apparentHomeFolder
    };
}

// Returns a list of the given directory
function list(path, fileExtensions) {
    checkLogin();
    var items = [];
    var files = system.getFile(system.user.homeFolder + path).getFiles();
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
    return items;
}

// Copies files
function share(paths) {
    console.dump(paths);
    var urls = [];
    paths.forEach(function(path) {
        // call ListShares to ensure the Shares folder has been created
        system.executeCustomCommand("ShareAPI.ListShares", [""]);

        var file = system.getFile(system.user.homeFolder + path);
        var sharePath = system.user.homeFolder + "/Shares/" + file.name;
        file.copyTo(sharePath);

        var jsonResponse = system.executeCustomCommand("ShareAPI.ShareFile", [file.name, file.length]);
        var response = JSON.parse(jsonResponse)
        urls.push({ name: file.name, url: response.result });
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
    checkLogin();
    try {
        if (singleFilename && paths.length > 1) {
            console.log("singleFilename = " + singleFilename);
            return { success: false, error: "Can't move/copy multiple files/folders to one target" };
        }

        var filePairs = [];
        paths.forEach(function(fromPath) {
            var fromFile = system.getFile(system.user.homeFolder + fromPath);
            var toFullPath = system.user.homeFolder + toPath;
            if (toFullPath[toFullPath.length - 1] != '/')
                toFullPath += '/';
            toFullPath += (singleFilename ? singleFilename : fromFile.name);
            var toFile = system.getFile(toFullPath);
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
            if (existing.length > 0)
                return { success: false, error: "Files/folders already exist", paths: existing };
        }

        filePairs.forEach(function(filePair) {
            if (filePair.to.exists())
                filePair.to.remove();
            var operation = filePair.from[move ? "moveTo" : "copyTo"]
            operation(filePair.to.fullPath);
        });
        return { success: true, error: null };
    } catch (e) {
        console.error(e);
        return { success: false, error: e };
    }
}

// Deletes a file
function remove(paths) {
    checkLogin();
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
    checkLogin();
    return system.user.homeFolder + request.form.destination + "/" + fileName;
}

// Returns the contents of a file
function getContent(path) {
    checkLogin();
    var file = system.getFile(system.user.homeFolder + path);
    return file.readText(content);
}

// Writes the given content to a file
function edit(path, content) {
    checkLogin();
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
    checkLogin();
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
    checkLogin();
    try {
        console.log(path);
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
    checkLogin();
    try {
        console.log(path);
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