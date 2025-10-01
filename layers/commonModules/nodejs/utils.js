function formatPokemonData(rawData, rawDataSpecies) {
  return {
    pokemonId: rawData.id,
    pokemonName: rawData.name,
    sprite: rawData.sprites.other["official-artwork"].front_default,
    types: rawData.types.map((t) => t.type.name).join(", "),
    isLegendary: rawDataSpecies.is_legendary,
    isMythical: rawDataSpecies.is_mythical
  };
}

module.exports = { formatPokemonData };
