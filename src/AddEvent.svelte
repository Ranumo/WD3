<script>
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  const tallenna = () =>
    dispatch('tallenna', {
      otsikko: otsikko,
      alkuAika: alkuAika,
      loppuAika: loppuAika,
      pv: pv,
      loppupv: loppupv,
      lisatiedot: lisatiedot,
      muistutus: muistutus,
    });
  const peruuta = () => dispatch('peruuta');
  export let otsikko = '';
  export let alkuAika;
  export let loppuAika;
  export let pv;
  export let loppupv;
  export let lisatiedot;
  export let toistuvuus = 'ei';
  export let muistutus = 'pv';
</script>

<Modal>
  <div slot="header">
    <h2>Syötä tapahtuman tiedot</h2>
    <hr />
  </div>

  <div class="otsikko flex">
    <label for="otsikko"
      >Otsikko
      <input
        type="text"
        id="otsikko"
        bind:value={otsikko}
        placeholder="Kirjoita otsikko"
      />
    </label>
  </div>

  <div class="aika flex">
    <label for="aika">Aika</label>
    <input type="time" id="aika" class="klo" bind:value={alkuAika} />
    <p>-</p>
    <input type="time" id="loppuaika" class="klo" bind:value={loppuAika} />

    <label>
      <input type="checkbox" value="kokopv" />
      Koko päivä
    </label>
  </div>

  <div class="flex">
    <p>Päivä</p>
    <div>
      <label for="pv">Alkamispäivä</label>
      <input type="date" bind:value={pv} />
    </div>
    <div>
      <label for="loppupv">Päättymispäivä</label>
      <input type="date" bind:value={loppupv} />
    </div>
  </div>

  <label>
    Toistuvuus
    <select bind:value={toistuvuus}>
      <option value="ei">Ei toistuvuutta</option>
      <option value="vko"> Viikoittain </option>
      <option value="kk"> Kuukausittain </option>
      <option value="vuosi"> Vuosittain </option>
    </select>
  </label>

  <label>
    Muistutus
    <select bind:value={muistutus}>
      <option value="ei">Ei muistutusta</option>
      <option value="tunti"> Tuntia aiemmin </option>
      <option value="pv"> Päivää aiemmin </option>
    </select>
  </label>

  <div class="lisatiedot flex">
    <label for="lisatiedot">Lisätietoja</label>
    <textarea
      placeholder="Kirjoita lisätiedot"
      rows="3"
      cols="70"
      bind:value={lisatiedot}
    />
  </div>

  <div slot="footer">
    <Button on:click={peruuta}>Peruuta</Button>
    <Button on:click={tallenna}>Tallenna</Button>
  </div>
</Modal>

<style>
  .flex {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2em;
  }
</style>
