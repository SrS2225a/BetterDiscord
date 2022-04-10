#Custom Uploader

Custom Uploader is a Better Discord plugin that allows you to upload files to your own server or another host.
With it, you can override the default uploader with to use your own upload service, or even upload message attachments to your service on the fily.

![Screenshot](https://nyx.hep.gg/XI6GpRayd)

### Installation
1. Download the 'Custom Uploader.pluging.js' file
2. Add it to your Better Discord plugins folder

### Usage
Before you can use the plugin, you need to set up your own upload service in the configuration settings. Failure to do so or configured incorrectly will result in the plugin not uploading anything.

### Troubleshooting
- Problem: No URL is being returned from the upload service.
  - Solution: Be sure that your URL Response settings are correct. Different services may require different settings, as one service sends their response differently to another one. Check the upload service documentation for more information.
- Problem: The plugin is not uploading anything.
  - Solution: Be sure that your upload service is working correctly. Your firewall may be blocking the plugin from connecting to it as well.
- Problem: The upload service responds with an 5XX or 4XX error.
  - Solution: You may have incorrect headers, body, or other settings in your upload service. Or the upload service does not accept your specified content type. Check the upload service documentation for more information.

If none of these solutions work, please contact the plugin author. You can find them on the [BetterDiscord Support Server](https://discord.com/invite/0Tmfo5ZbORCRqbAd) under the username Nyx#8614.