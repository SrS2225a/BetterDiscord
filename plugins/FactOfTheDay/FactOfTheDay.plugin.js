/**
 * @name FactOfTheDay
 * @author Nyx & Xenon Colt
 * @authorId 270848136006729728
 * @version 2.0.0
 * @license MIT
 * @description Gives you a (useless) random fact, or qoute of the day each time you login to discord.
 * @website https://www.nyxgoddess.org/
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/FactOfTheDay/FactOfTheDay.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/FactOfTheDay/FactOfTheDay.plugin.js
 */

const config = {
    main: "FactOfTheDay.plugin.js",
    authorId: "270848136006729728",
    contributors: [
        {
            name: "Xenon Colt",
            discord_id: "709210314230726776",
            github_username: "xenoncolt",
        }
    ],
    info: {
        name: "FactOfTheDay",
        authors: [
            {
                name: "Nyx & Xenon Colt",
                github_username: "SrS2225a",
                link: "https://github.com/SrS2225a"
            }
        ],
        version: "2.0.0",
        description: "Gives you a (useless) random fact, or qoute of the day each time you login to discord.",
        github_raw: "https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/FactOfTheDay/FactOfTheDay.plugin.js"
    },
    changelog: [
        {
            title: "New Features & Improvements",
            type: "added",
            items: [
                "Refactor the plugin structure",
                "Now fact and quote will be shown in a notice",
            ]
        },
        // {
        //     title: "Fixed Few Things",
        //     type: "fixed",
        //     items: [
        //         "Fixed `Change status to :` UI problem",
        //         "Fixed problem when discord force closes where it doesn't set your status back to online",
        //     ]
        // },
        // {
        //     title: "Changed Few Things",
        //     type: "changed",
        //     items: [
        //         "Changed settings UI",
        //     ]
        // }
    ],
    settingsPanel: [
        {
            type: "switch",
            id: "dailyRequests",
            name: "Daily Requests",
            note: "When enabled, the plugin will only get a new fact of the day once a day. When disabled, it will get a new fact of the day every time you login.",
            value: true
        },
        {
            type: "radio",
            id: "requestsType",
            name: "Request Type",
            options: [
                { name: "Fact", value: "fact" },
                { name: "Quote", value: "quote" },
            ],
            note: "Choose the category of the daily message",
            value: "fact"
        }
    ]
};

let defaultSettings = {
    dailyRequests: true,
    requestsType: "fact",
}

const request = require("request");

const { Webpack, UI, Logger, Data, Utils } = BdApi;

class FactOfTheDay {
    constructor() {
        this._config = config;

        this.settings = Data.load(this._config.info.name, "settings");

    }

    start() {
        this.settings = Data.load(this._config.info.name, "settings") || defaultSettings;

        if (Data.load(this._config.info.name, "settings") == null) this.saveAndUpdate();

        this.checkForChangelog();

        if (this.settings.dailyRequests) {
            const lastRequest = Data.load(this._config.info.name, "lastRequest") || 0;
            if (!(Object.entries(this.settings).length === 0 && Date.now() - lastRequest > 24 * 60 * 60 * 1000)) this.createRequest();
            Data.save(this._config.info.name, "lastRequest", Date.now().toString());
        }
    }

    stop() {

    }

    getSettingsPanel() {
        for (const setting of this._config.settingsPanel) {
            if (this.settings[setting.id] !== undefined) {
                setting.value = this.settings[setting.id];
            }
        }

        return UI.buildSettingsPanel({
            settings: this._config.settingsPanel,
            onChange: (category, id, value) => {
                this.settings[id] = value;
                this.saveAndUpdate();
            },
        })
    }

    saveAndUpdate() {
        Data.save(this._config.info.name, "settings", this.settings);
    }

    createRequest() {
        const requestType = this.settings.requestsType;
        const isQuote = requestType === "quote";
        const endPoint = isQuote ? "random-quotes" : "random-facts";
        
        request.get(`https://nyxgoddess.org/api/${endPoint}`, (error, response, body) => {
            if (error) {
                Logger.error(this._config.info.name, `Error fetching ${requestType}:`, error);
                UI.showToast(`Error fetching ${requestType}`, { type: "error" });
                return;
            }

            try {
                console.log(`[FactOfTheDay] :${requestType}:` + body);
                const parsedResponse = JSON.parse(body);

                // I have a another plan in my mind for this, but for now, let's just make it simple using notice;
                // let title = isQuote ? "Quote of the Day" : "Fact of the Day";
                let content = isQuote ? `📜 Quote: "${parsedResponse.quote}" - ${parsedResponse.author}` : `🔍 Fact: ${parsedResponse.fact} - ${parsedResponse.source}`;

                UI.showNotice(content, {
                    type: "info",
                    timeout: 5 * 60 * 1000
                });

                // FOR FUTURE USE
                // UI.showNotification({
                //     id: this._config.info.name,
                //     content: content,
                //     type: "info",
                //     duration: Infinity,
                //     actions: [
                //         {
                //             label: "Close",
                //         }
                //     ]
                // });
            } catch (err) {
                Logger.error(this._config.info.name, `Error parsing ${requestType} response:`, err);
                UI.showToast(`Error parsing ${requestType} response`, { type: "error" });

            }
        });
    }

    checkForChangelog() {
        try {
            let currentVersionInfo = {};
            try {
                currentVersionInfo = Object.assign({}, { version: this._config.info.version, hasShownChangelog: false }, Data.load(this._config.info.name, "currentVersionInfo"));
            } catch (err) {
                currentVersionInfo = { version: this._config.info.version, hasShownChangelog: false };
            }
            if (this._config.info.version != currentVersionInfo.version) currentVersionInfo.hasShownChangelog = false;
            currentVersionInfo.version = this._config.info.version;
            Data.save(this._config.info.name, "currentVersionInfo", currentVersionInfo);

            if (!currentVersionInfo.hasShownChangelog) {
                UI.showChangelogModal({
                    title: "AutoDNDOnGame Changelog",
                    subtitle: this._config.info.version,
                    changes: this._config.changelog
                });
                currentVersionInfo.hasShownChangelog = true;
                Data.save(this._config.info.name, "currentVersionInfo", currentVersionInfo);
            }
        }
        catch (err) {
            Logger.error(this._config.info.name, err);
        }
    }
}

module.exports = FactOfTheDay;