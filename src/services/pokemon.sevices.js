const fetchallPokemon = async () => {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=150`)
        if (!res.ok) {
            console.error('Error fetching Pokemon:', res.statusText)
            return null;
        }
        const data = await res.json()
        
        // Fetch details for each Pokemon to get images and info
        const pokemonDetails = await Promise.all(
            data.results.map(async (pokemon) => {
                try {
                    const detailRes = await fetch(pokemon.url)
                    if (!detailRes.ok) throw new Error(`Failed to fetch ${pokemon.name}`)
                    const detailData = await detailRes.json()
                    return {
                        name: detailData.name,
                        image: detailData.sprites.other['official-artwork'].front_default || detailData.sprites.front_default,
                        id: detailData.id,
                        types: detailData.types.map(t => t.type.name),
                        abilities: detailData.abilities.map(a => a.ability.name),
                        height: detailData.height / 10,
                        weight: detailData.weight / 10,
                        stats: detailData.stats.map(s => ({
                            name: s.stat.name,
                            value: s.base_stat
                        }))
                    }
                } catch (error) {
                    console.error(`Error fetching details for ${pokemon.name}:`, error)
                    return null
                }
            })
        )
        
        return pokemonDetails.filter(pokemon => pokemon !== null);
    }
    catch (error) {
        console.error('Error fetching Pokemon:', error)
        return null;
    }
}

const fetchPokemonLazy = async (offset = 0, limit = 20, type = null) => {
    try {
        let url = type 
            ? `https://pokeapi.co/api/v2/type/${type}` 
            : `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`
        
        const res = await fetch(url)
        if (!res.ok) {
            console.error('Error fetching Pokemon:', res.statusText)
            return { pokemon: [], hasMore: false, total: 0 };
        }
        const data = await res.json()
        
        // If filtering by type, get pokemon from type endpoint
        let results = type ? data.pokemon.slice(offset, offset + limit).map(p => ({ url: p.pokemon.url })) : data.results
        const total = type ? data.pokemon.length : data.count
        
        // Fetch details for each Pokemon
        const pokemonDetails = await Promise.all(
            results.map(async (pokemon) => {
                try {
                    const detailRes = await fetch(pokemon.url)
                    if (!detailRes.ok) throw new Error(`Failed to fetch ${pokemon.name}`)
                    const detailData = await detailRes.json()
                    return {
                        name: detailData.name,
                        image: detailData.sprites.other['official-artwork'].front_default || detailData.sprites.front_default,
                        id: detailData.id,
                        types: detailData.types.map(t => t.type.name),
                        abilities: detailData.abilities.map(a => a.ability.name),
                        height: detailData.height / 10,
                        weight: detailData.weight / 10,
                        stats: detailData.stats.map(s => ({
                            name: s.stat.name,
                            value: s.base_stat
                        }))
                    }
                } catch (error) {
                    console.error(`Error fetching details for ${pokemon.name}:`, error)
                    return null
                }
            })
        )
        
        const filteredPokemon = pokemonDetails.filter(pokemon => pokemon !== null)
        const hasMore = type ? (offset + limit < total) : (data.next !== null)
        
        return {
            pokemon: filteredPokemon,
            hasMore,
            total
        };
    }
    catch (error) {
        console.error('Error fetching Pokemon:', error)
        return { pokemon: [], hasMore: false, total: 0 };
    }
}

const fetchAllTypes = async () => {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/type?limit=20`)
        if (!res.ok) {
            console.error('Error fetching types:', res.statusText)
            return [];
        }
        const data = await res.json()
        return data.results.map(type => type.name).sort()
    }
    catch (error) {
        console.error('Error fetching types:', error)
        return [];
    }
}

export { fetchPokemonLazy, fetchAllTypes };
export default fetchallPokemon;

        