/**
 * @name FactOfTheDay
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description Gives you a (useless) random fact of the day each time you login to discord.
 * @website https://github.com/SrS2225a
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/ReplaceTimestamps/ReplaceTimestamps.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/ReplaceTimestamps/ReplaceTimestamps.plugin.js
 */


const request = require("request");
module.exports = (() => {
    const config = {
        info: {
            name: "FactOfTheDay",
            authors: [
                {
                    name: "Nyx",
                    discord_id: "27048136006729728",
                }
            ],
            version: "1.0.1",
            description: "Gives you a (useless) random fact of the day each time you login to discord."
        },
        changelog: [
            {
                title: "Fixes",
                items: [`Facts now ignores markdown formatting.`]
            }
        ],
        github: "https://github.com/SrS2225a/BetterDiscord/blob/master/plugins/ReplaceTimestamps/ReplaceTimestamps.plugin.js",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/ReplaceTimestamps/ReplaceTimestamps.plugin.js",
        main: "index.js",
    };
    return !global.ZeresPluginLibrary ? class {
            constructor() {
                this._config = config;
            }
            getName() {
                return config.info.name;
            }
            getAuthor() {
                return config.info.authors.map((a) => a.name).join(", ");
            }
            getDescription() {
                return config.info.description;
            }
            getVersion() {
                return config.info.version;
            }
            load() {
                BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onConfirm: () => {
                        request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                            if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                            await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                        });
                    }
                });
            }
            start() {}
            stop() {}
        }
        : (([Plugin, Library]) => {
            const plugin = (Plugin, Library) => {
                const { Patcher, Modals } = Library;

                return class ReplaceTimestamps extends Plugin {

                    onStart() {
                        function ignoreMardown(str) {
                            return str.replace(/\*|_|~|`/g, "").replace(/\n/g, " ");
                        }
                        request.get("https://uselessfacts.jsph.pl/today.json?language=en", (error, response, body) => {
                            console.log(body);
                            Modals.showAlertModal(
                                "Fact of the Day",
                                ignoreMardown(JSON.parse(body).text)
                            );
                        });
                    }

                    onStop() {
                        Patcher.unpatchAll();
                    }
                };
            };
            return plugin(Plugin, Library);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();

