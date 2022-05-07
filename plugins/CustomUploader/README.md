# Custom Uploader

Custom Uploader is a Better Discord plugin that allows you to upload files to your own server or another host.
With it, you can override the default uploader with to use your own upload service, or even upload message attachments to your service on the fly.

![Screenshot](https://nyx.hep.gg/XI6GpRayd)

## Installation
1. Download the 'Custom Uploader.pluging.js' file
2. Add it to your Better Discord plugins folder

## Usage
Additionally, the plugin has a built-in URL response parser. This allows you to use the response from your upload service to get the URL of the uploaded file.
***
### response
If the response only contains file name (or id) and would like to append it to a domain, then you can use this syntax.
**Example:**
```
https://example.com/$json:response
```
Buf if the response just contains a full URL, then you can use this syntax.

**Example:**
```
$json:response
```
Notice how we use the `$json` syntax to get the JSON object from the response. Followed by the `:response` to get the value property of the JSON object.
***
### json
You can use jsonPath to parse the url from a JSON response.

**Example response:**
```json
{
  "status": 200,
  "data": {
    "link": "https:\/\/example.com\/image.png"
  }
}
```
**Syntax:**
```
$json:data.link
```
**Example response 2:**
```json
{
  "success": true,
  "files": [
    {
      "name": "image.png",
      "url": "https://example.com/image.png"
    }
  ]
}
```
**Syntax:**
```
$json:files[0].url
```
***
### xml
You can use jsonPath to parse the url from a XML response.

**Example response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<files>
    <file>
        <name>image.png</name>
        <url>https://example.com/image.png</url>
    </file>
  <file>
    <name>image2.png</name>
    <url>https://example.com/image2.png</url>
  </file>
</files>
```
**Syntax:**
```
$xml:files.file[0].url
```
***
### regex
You can use regex to parse the url from a response.

An `//|` operator can also be used to separate multiple regexes.
As example: Use `//|1` gets the first match.

**Example response:**
```
https://example.com/image.png
```
**Syntax:**
```
$regex:https:\/\/example.com\/(.*)//|1
```
***
P.S. You need to set up your own upload service in the configuration settings. Failure to do so or configured incorrectly will result in the plugin not uploading anything.

## Troubleshooting
- Problem: No URL is being returned from the upload service.
  - Solution: Be sure that your URL Response settings are correct. Different services may require different settings, as one service sends their response differently to another one. Check the upload service documentation for more information.
- Problem: The plugin is not uploading anything.
  - Solution: Be sure that your upload service is working correctly. Your firewall may be blocking the plugin from connecting to it as well.
- Problem: The upload service responds with an 5XX or 4XX error.
  - Solution: You may have incorrect headers, body, or other settings in your upload service. Or the upload service does not accept your specified content type. Check the upload service documentation for more information.

If none of these solutions work, please contact the plugin author. You can find them on the [BetterDiscord Support Server](https://discord.com/invite/0Tmfo5ZbORCRqbAd) under the username Nyx#8614. Or create an issue
