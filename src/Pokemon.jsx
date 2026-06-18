import { useState, useEffect, useRef, useCallback } from "react";
import fetchAllPokemon, {
    fetchPokemonDetails,
    fetchAllTypes,
    fetchPokemonByType,
} from "./services/pokemon.sevices";

function Pokemon() {
    const [pokemons, setPokemons] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    const [hoveredId, setHoveredId] = useState(null);

    const [pokemonDetails, setPokemonDetails] = useState({});
    const [loadingDetails, setLoadingDetails] = useState({});

    const observerTarget = useRef(null);

    const loadMorePokemon = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);

        try {
            let result;
            if (selectedType) {
                result = await fetchPokemonByType(selectedType, offset, 20);
            } else {
                // For all pokemon, fetch next batch
                const res = await fetch(
                    `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=20`
                );
                const data = await res.json();
                result = {
                    pokemon: data.results.map((pokemon) => {
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
                    hasMore: data.next !== null,
                };
            }

            if (result.pokemon && result.pokemon.length > 0) {
                setPokemons((prev) => [...prev, ...result.pokemon]);
                setOffset((prev) => prev + 20);
                setHasMore(result.hasMore);
            }
        } catch (error) {
            console.error("Error loading more Pokemon:", error);
        }

        setLoadingMore(false);
    }, [offset, loadingMore, hasMore, selectedType]);

    // Initial load
    useEffect(() => {
        const loadPokemon = async () => {
            setLoading(true);
            setPokemons([]);
            setOffset(0);
            setHasMore(true);

            try {
                let result;
                if (selectedType) {
                    result = await fetchPokemonByType(selectedType, 0, 20);
                } else {
                    const res = await fetch(
                        "https://pokeapi.co/api/v2/pokemon?offset=0&limit=20"
                    );
                    const data = await res.json();
                    result = {
                        pokemon: data.results.map((pokemon) => {
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
                        hasMore: data.next !== null,
                    };
                }

                setPokemons(result.pokemon);
                setOffset(20);
                setHasMore(result.hasMore);
            } catch (error) {
                console.error("Error loading Pokemon:", error);
            }

            setLoading(false);
        };

        loadPokemon();
    }, [selectedType]);

    useEffect(() => {
        const getTypes = async () => {
            setLoadingTypes(true);

            const typeList = await fetchAllTypes();

            setTypes(typeList);

            setLoadingTypes(false);
        };

        getTypes();
    }, []);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loadingMore) {
                loadMorePokemon();
            }
        });

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loadingMore, loadMorePokemon]);

    const handleHover = async (id) => {
        setHoveredId(id);

        if (pokemonDetails[id]) {
            return;
        }

        setLoadingDetails((prev) => ({
            ...prev,
            [id]: true,
        }));

        const details = await fetchPokemonDetails(id);

        if (details) {
            setPokemonDetails((prev) => ({
                ...prev,
                [id]: details,
            }));
        }

        setLoadingDetails((prev) => ({
            ...prev,
            [id]: false,
        }));
    };

    const filteredPokemons = pokemons;

    if (loading) {
        return (
            <div className="p-8 text-center">
                Loading Pokémon...
            </div>
        );
    }

    return (
        <>
            <div className="p-6 bg-gray-50 border-b">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedType(null)}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            selectedType === null
                                ? "bg-blue-500 text-white"
                                : "bg-white border"
                        }`}
                    >
                        All
                    </button>

                    {loadingTypes ? (
                        <div>Loading types...</div>
                    ) : (
                        types.map((type) => (
                            <button
                                key={type}
                                onClick={() =>
                                    setSelectedType(type)
                                }
                                className={`px-4 py-2 rounded-lg capitalize ${
                                    selectedType === type
                                        ? "bg-blue-500 text-white"
                                        : "bg-white border"
                                }`}
                            >
                                {type}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 p-8">
                {filteredPokemons.map((pokemon) => (
                    <div
                        key={pokemon.id}
                        className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                        onMouseEnter={() =>
                            handleHover(pokemon.id)
                        }
                        onMouseLeave={() =>
                            setHoveredId(null)
                        }
                    >
                        {hoveredId === pokemon.id ? (
                            loadingDetails[pokemon.id] ? (
                                <div className="h-64 flex items-center justify-center bg-blue-500 text-white">
                                    Loading...
                                </div>
                            ) : pokemonDetails[
                                  pokemon.id
                              ] ? (
                                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white h-full flex flex-col justify-between min-h-64">
                                    <div>
                                        <h3 className="text-2xl font-bold capitalize mb-3">
                                            {
                                                pokemonDetails[
                                                    pokemon.id
                                                ].name
                                            }
                                        </h3>

                                        <p className="text-sm font-semibold mb-2">
                                            ID: #{pokemon.id}
                                        </p>

                                        <div className="mb-3">
                                            <p className="text-xs font-semibold mb-1">
                                                TYPES:
                                            </p>

                                            <div className="flex gap-2 flex-wrap">
                                                {pokemonDetails[
                                                    pokemon.id
                                                ].types.map(
                                                    (
                                                        type
                                                    ) => (
                                                        <span
                                                            key={
                                                                type
                                                            }
                                                            className="bg-white/20 px-2 py-1 rounded text-xs capitalize"
                                                        >
                                                            {
                                                                type
                                                            }
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-xs font-semibold">
                                                SIZE:
                                            </p>

                                            <p className="text-sm">
                                                Height:{" "}
                                                {
                                                    pokemonDetails[
                                                        pokemon
                                                            .id
                                                    ].height
                                                }
                                                m |
                                                Weight:{" "}
                                                {
                                                    pokemonDetails[
                                                        pokemon
                                                            .id
                                                    ].weight
                                                }
                                                kg
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold mb-1">
                                                ABILITIES:
                                            </p>

                                            <p className="text-xs capitalize">
                                                {pokemonDetails[
                                                    pokemon.id
                                                ].abilities
                                                    .slice(
                                                        0,
                                                        2
                                                    )
                                                    .join(
                                                        ", "
                                                    )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-xs">
                                        <p className="font-semibold mb-2">
                                            STATS:
                                        </p>

                                        <div className="space-y-1">
                                            {pokemonDetails[
                                                pokemon.id
                                            ].stats
                                                .slice(
                                                    0,
                                                    3
                                                )
                                                .map(
                                                    (
                                                        stat
                                                    ) => (
                                                        <div
                                                            key={
                                                                stat.name
                                                            }
                                                            className="flex justify-between"
                                                        >
                                                            <span className="capitalize">
                                                                {
                                                                    stat.name
                                                                }
                                                            </span>

                                                            <span className="font-bold">
                                                                {
                                                                    stat.value
                                                                }
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        ) : (
                            <>
                                <div className="bg-gray-100 p-4 flex justify-center">
                                    <img
                                        src={
                                            pokemon.image
                                        }
                                        alt={
                                            pokemon.name
                                        }
                                        className="h-40 w-40 object-contain"
                                    />
                                </div>

                                <div className="p-4">
                                    <h3 className="text-lg font-semibold capitalize text-center">
                                        {
                                            pokemon.name
                                        }
                                    </h3>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="p-8 text-center">
                {loadingMore && (
                    <div className="text-gray-700 font-semibold">
                        Loading more Pokémon...
                    </div>
                )}
                {!hasMore && pokemons.length > 0 && (
                    <div className="text-gray-500">
                        No more Pokémon to load
                    </div>
                )}
            </div>
        </>
    );
}

export default Pokemon;