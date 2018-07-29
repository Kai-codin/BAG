/** Rail Announcements Generator. By Roy Curtis, MIT license, 2018 */

/** Controller for the top toolbar */
class Toolbar
{
    /** Reference to the container for the toolbar */
    private dom         : HTMLElement;
    /** Reference to the play button */
    private btnPlay     : HTMLButtonElement;
    /** Reference to the stop button */
    private btnStop     : HTMLButtonElement;
    /** Reference to the generate random phrase button */
    private btnGenerate : HTMLButtonElement;
    /** Reference to the save state button */
    private btnSave     : HTMLButtonElement;
    /** Reference to the recall state button */
    private btnRecall   : HTMLButtonElement;
    /** Reference to the settings button */
    private btnOption   : HTMLButtonElement;

    public constructor()
    {
        this.dom         = DOM.require('#toolbar');
        this.btnPlay     = DOM.require('#btnPlay');
        this.btnStop     = DOM.require('#btnStop');
        this.btnGenerate = DOM.require('#btnShuffle');
        this.btnSave     = DOM.require('#btnSave');
        this.btnRecall   = DOM.require('#btnLoad');
        this.btnOption   = DOM.require('#btnSettings');

        this.btnStop.onclick     = this.handleStop.bind(this);
        this.btnGenerate.onclick = RAG.generate;
        this.btnSave.onclick     = this.handleSave.bind(this);
        this.btnRecall.onclick   = this.handleLoad.bind(this);
        this.btnOption.onclick   = this.handleOption.bind(this);

        this.btnPlay.onclick = ev =>
        {
            // Has to execute on a delay, as speech cancel is unreliable without it
            ev.preventDefault();
            RAG.speech.cancel();
            this.btnPlay.disabled = true;
            window.setTimeout(this.handlePlay.bind(this), 200);
        }
    }

    /** Handles the play button, playing the editor's current phrase with speech */
    private handlePlay() : void
    {
        // Note: It would be nice to have the play button change to the stop button and
        // automatically change back. However, speech's 'onend' event was found to be
        // unreliable, so I decided to keep play and stop separate.

        let text   = RAG.views.editor.getText();
        let parts  = text.trim().split(/\.\s/i);
        let voices = RAG.speech.getVoices();
        let voice  = RAG.config.voxChoice;

        // Reset to default voice, if it's missing
        if (!voices[voice])
            RAG.config.voxChoice = voice = 0;

        RAG.speech.cancel();
        parts.forEach( segment =>
        {
            let utterance = new SpeechSynthesisUtterance(segment);

            utterance.voice  = voices[voice];
            utterance.volume = RAG.config.voxVolume;
            utterance.pitch  = RAG.config.voxPitch;
            utterance.rate   = RAG.config.voxRate;

            RAG.speech.speak(utterance)
        });

        RAG.views.marquee.set(text);
        this.btnPlay.disabled = false;
    }

    /** Handles the stop button, stopping the marquee and any speech */
    private handleStop() : void
    {
        RAG.speech.cancel();
        RAG.views.marquee.stop();
    }

    /** Handles the save button, persisting the current train state to storage */
    private handleSave() : void
    {
        try
        {
            let css = 'font-size: large; font-weight: bold;';
            let raw = JSON.stringify(RAG.state);
            window.localStorage['state'] = raw;

            console.log(L.STATE_COPY_PASTE(), css);
            console.log("RAG.load('", raw.replace("'", "\\'"), "')");
            console.log(L.STATE_RAW_JSON(), css);
            console.log(raw);

            RAG.views.marquee.set( L.STATE_TO_STORAGE() );
        }
        catch (e)
        {
            RAG.views.marquee.set( L.STATE_SAVE_FAIL(e.message) );
        }
    }

    /** Handles the load button, loading train state from storage, if it exists */
    private handleLoad() : void
    {
        let data = window.localStorage['state'];

        return data
            ? RAG.load(data)
            : RAG.views.marquee.set( L.STATE_SAVE_MISSING() );
    }

    /** Handles the settings button, opening the settings dialog */
    private handleOption() : void
    {
        RAG.views.settings.open();
    }
}