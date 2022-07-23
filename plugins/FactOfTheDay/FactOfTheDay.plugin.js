/**
 * @name FactOfTheDay
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description Gives you a (useless) random fact of the day each time you login to discord.
 * @website https://www.nyxgoddess.org/
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/FactOfTheDay/FactOfTheDay.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/FactOfTheDay/FactOfTheDay.plugin.js
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
            version: "1.1.0",
            description: "Gives you a (useless) random fact of the day each time you login to discord."
        },
        changelog: [
            {
                title: "Improvements",
                items: [`Switched to a new personal API to get the fact of the day.`,
                "You can now choose when you want to get a random fact of the day. Either daily or every time you login."]
            }
        ],
        github: "https://github.com/SrS2225a/BetterDiscord/blob/master/plugins/FactOfTheDay/FactOfTheDay.plugin.js",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/FactOfTheDay/FactOfTheDay.plugin.js",
        main: "index.js",
        defaultConfig: [
            {
                type: "switch",
                id: "dailyRequests",
                name: "Daily Requests",
                value: true,
                note: "When enabled, the plugin will only get a new fact of the day once a day. When disabled, it will get a new fact of the day every time you login."
            }
        ]
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
                const { Patcher, Modals, PluginUtilities } = Library;

                return class ReplaceTimestamps extends Plugin {

                    onStart() {
                        function createRequest() {
                            request.get("https://nyxgoddess.org/api/random-facts", (error, response, body) => {
                                console.log("[FactOfTheDay] " + body);
                                Modals.showAlertModal(
                                    "Fact of the Day",
                                    JSON.parse(body).fact + "\n\n" + JSON.parse(body).url
                                );
                            });
                        }

                        // only make request once per day
                        if (this.settings?.dailyRequests) {
                            const limit = BdApi.loadData(config.info.name, "LastRequest") || 0;
                            if (Object.entries(limit).length === 0 || Date.now() - limit > 86400000) {
                                PluginUtilities.saveData(config.info.name, "LastRequest", Date.now().toString());
                                createRequest()
                            }
                        } else {
                            createRequest()
                        }
                    }

                    getSettingsPanel() {
                        return this.buildSettingsPanel().getElement();
                    }

                    onStop() {
                        Patcher.unpatchAll();
                    }
                };
            };
            return plugin(Plugin, Library);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();

