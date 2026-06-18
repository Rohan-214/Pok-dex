const BASE_URL = "https://pokeapi.co/api/v2";

// Cache for pokemon details
const pokemonDetailsCache = {};

/**
 * Fetch only name + image for listing
 * 1 API call only
 */
const fetchAllPokemon = async () => {
    try {
        const res = await fetch(
            `${BASE_URL}/pokemon?limit=150`
        );

        if (!res.ok) {
            throw new Error("Failed to fetch Pokémon");
        }

        const data = await res.json();

        return data.results.map((pokemon) => {
            const id = pokemon.url
                .split("/")
                .filter(Boolean)
                .pop();

            return {
                id,
                name: pokemon.name,
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
            };
        });
    } catch (error) {
        console.error("Error fetching Pokémon:", error);
        return [];
    }
};

/**
 * Fetch details of a pokemon on hover
 * Uses cache so same pokemon is never fetched twice
 */
const fetchPokemonDetails = async (id) => {
    try {
        // Check cache first
        if (pokemonDetailsCache[id]) {
            return pokemonDetailsCache[id];
        }

        const res = await fetch(
            `${BASE_URL}/pokemon/${id}`
        );

        if (!res.ok) {
            throw new Error("Failed to fetch Pokémon details");
        }

        const data = await res.json();

        const pokemonDetails = {
            id: data.id,
            name: data.name,
            image:
                data.sprites.other?.["official-artwork"]
                    ?.front_default ||
                data.sprites.front_default,
            types: data.types.map(
                ({ type }) => type.name
            ),
            abilities: data.abilities.map(
                ({ ability }) => ability.name
            ),
            height: data.height / 10,
            weight: data.weight / 10,
            stats: data.stats.map(
                ({ stat, base_stat }) => ({
                    name: stat.name,
                    value: base_stat,
                })
            ),
        };

        // Save to cache
        pokemonDetailsCache[id] = pokemonDetails;

        return pokemonDetails;
    } catch (error) {
        console.error(
            "Error fetching Pokémon details:",
            error
        );

        return null;
    }
};

/**
 * Fetch pokemon by type with pagination
 */
const fetchPokemonByType = async (type, offset = 0, limit = 20) => {
    try {
        const res = await fetch(
            `${BASE_URL}/type/${type}`
        );

        if (!res.ok) {
            throw new Error("Failed to fetch Pokémon by type");
        }

        const data = await res.json();
        const totalPokemon = data.pokemon.length;
        const paginatedPokemon = data.pokemon.slice(offset, offset + limit);

        return {
            pokemon: paginatedPokemon.map(({ pokemon }) => {
                const id = pokemon.url
                    .split("/")
                    .filter(Boolean)
                    .pop();

                return {
                    id,
                    name: pokemon.name,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
                };
            }),
            hasMore: offset + limit < totalPokemon,
            total: totalPokemon,
        };
    } catch (error) {
        console.error(
            "Error fetching Pokémon by type:",
            error
        );
        return { pokemon: [], hasMore: false, total: 0 };
    }
};

/**
 * Fetch all pokemon types
 */
const fetchAllTypes = async () => {
    try {
        const res = await fetch(
            `${BASE_URL}/type?limit=20`
        );

        if (!res.ok) {
            throw new Error("Failed to fetch types");
        }

        const data = await res.json();

        return data.results
            .map((type) => type.name)
            .sort();
    } catch (error) {
        console.error(
            "Error fetching types:",
            error
        );

        return [];
    }
};

export {
    fetchPokemonDetails,
    fetchAllTypes,
    fetchPokemonByType,
};

export default fetchAllPokemon;