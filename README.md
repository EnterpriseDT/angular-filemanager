### Description: 

This is the step-by-step instruction on how to install the new web file-manager (i.e. angular web file-manager) in CompleteFTP.

### Steps:

**1.** First, clone the repository of the web file-manager [here](https://github.com/EnterpriseDT/completeftp-filemanager).

**2.** Then launch the *CompleteFTP Manager* and go to the *Folders* panel.
 
![Select Folders panel](/img/selectFolderPanel.png)

**3.** Click *Add root folder* at the top of the panel and select *Windows Folder* menu item to add a root Windows folder in the virtual file-system.

![Add root Windows folder](/img/addRootWindowsFolder.png)

**4.** Then map it to the cloned folder (i.e. *completeftp-filemanager*) in the Windows file-system and press *OK* button.

![Mapping folder](/img/mapFolder.png)

**5.** (Optional) Change the name of the newly created folder to whatever you like by clicking the ellipsis button of the *Name* property, typing a name (e.g. *NewFileManager*) and pressing *OK* button. 

![Change folder name](/img/changeFolderName.png)

**6.** Click *Apply changes* button to save the changes to the CompleteFTP server.

![Apply change](/img/applyChanges.png)

**7.** Now, open a web browser, navigate to your CompleteFTP server (e.g. http://myserver), and login if you haven't logged in yet.

![Login](/img/login.png)

**8.** After logging in successfully, navigate to the new web file-manager at http://myserver/NewFileManager.

![New File-Manager](/img/newFileManager.png)
