### Description: 
Currently, the web file-manager that CompleteFTP supports is based on the elFiner file manager (see [here](https://enterprisedt.com/products/completeftp/doc/guide/html/howtousefilemanager.html)).

However, it's possible that you can replace that one by a specific file-manager called [angular file-manager](https://github.com/joni2back/angular-filemanager). 

We would like to recommend you to try it out as it's a more modern, multilingual file-manager and a better solution for mobile. 

You might want to:

**1.** Try the new file-manager (i.e. *angular file-manager*) out first to see how it works by installing it side by side with the existing file-manager (i.e. *elFiner file-manager*).

**2.** After evaluating the new file-manager, if it's what you prefer, replace the existing one by it.

The following step-by-step instructions will show you how to do that.

### Steps for installing the angular file-manager side by side with the existing one:

**1.** First, clone the repository of the angular file-manager [here](https://github.com/EnterpriseDT/completeftp-filemanager).

**2.** Then launch the *CompleteFTP Manager* and go to the *Folders* panel.
 
![Select Folders panel](/img/selectFolderPanel.png)

**3.** Click *Add root folder* at the top of the panel and select *Windows Folder* menu item to add a root Windows folder in the virtual file-system.

![Add root Windows folder](/img/addRootWindowsFolder.png)

**4.** When the *Select a folder* dialog appears, select the cloned folder (i.e. *completeftp-filemanager*) in the Windows file-system and press *OK* button.

![Mapping folder](/img/mapFolder.png)

**5.** (Optional) Change the name of the newly created folder to whatever you like by selecting it and clicking the ellipsis button of the *Name* property, typing a name (e.g. *NewFileManager*) and pressing *OK* button. 

![Change folder name](/img/changeFolderName.png)

**6.** Click *Apply changes* button at the top-right of the CompleteFTP Manager.

![Apply change](/img/applyChanges.png)

**7.** Now, open a web browser, navigate to your CompleteFTP server (e.g. http://myserver), and login if you haven't logged in yet.

![Login](/img/login.png)

**8.** After logging in successfully, navigate to the new file-manager at http://myserver/NewFileManager and try it.

![New File-Manager](/img/installFileManagerResult.png)


### Steps for replacing the existing file-manager:


**1.** Launch the *CompleteFTP Manager* and go to the *Folders* panel.

![Select Folders panel](/img/selectFolderPanel.png)

**2.** Click the *Options* menu at the bottom-left of the CompleteFTP Manager and check the *Show system users/folders/sites* menu item to make all system folders appear in the folder list.

![Show system users/folders/sites](/img/showSystemFolders.png)

**3.** Select the *FileManager* folder and change its path by clicking the ellipsis button of the *Path* property.

![Select File Manager](/img/selectFileManagerFolder.png)

**4.** That will bring up the *Select a folder* dialog. Select the cloned folder (i.e. *completeftp-filemanager*) in the Windows file-system and click *OK* button.

![Mapping folder](/img/mapFolder.png)

**5.** Click *Apply changes* button at the top-right of the CompleteFTP Manager

![Apply change](/img/applyChanges.png)

**6.** Launch a web browser, navigate to your CompleteFTP server (e.g. http://myserver) and login.

![Login](/img/login.png)

**7.** After logging in successfully, the new file-manager will be loaded straight away and ready to be used.

![New File-Manager](/img/replaceFileManagerResult.png)

**Note:** 
in case you want to revert to the old file-manager (i.e. *elFiner file-Manager*), just simply change the path of the *FileManager* folder to *C:\ProgramData\Enterprise Distributed Technologies\Complete FTP\FileManager* and don't forget to click *Apply Changes* button.

![Revert back to the old file-manager](/img/revertBackOldFileManager.png) 

