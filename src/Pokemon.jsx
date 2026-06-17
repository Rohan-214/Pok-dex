import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchPokemonLazy, fetchAllTypes } from './services/pokemon.sevices'

function Pokemon() {
    const [pokemons, setPokemons] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hoveredId, setHoveredId] = useState(null)
    const [hasMore, setHasMore] = useState(true)
    const [offset, setOffset] = useState(0)
    const [selectedType, setSelectedType] = useState(null)
    const [types, setTypes] = useState([])
    const [loadingTypes, setLoadingTypes] = useState(true)
    const observerTarget = useRef(null)

    // Fetch types on mount
    useEffect(() => {
        const getTypes = async () => {
            setLoadingTypes(true)
            const typeList = await fetchAllTypes()
            setTypes(typeList)
            setLoadingTypes(false)
        }
        getTypes()
    }, [])

    const loadMorePokemon = useCallback(async () => {
        if (loading || !hasMore) return
        
        setLoading(true)
        const result = await fetchPokemonLazy(offset, 20, selectedType)
        
        if (result.pokemon && result.pokemon.length > 0) {
            setPokemons(prev => [...prev, ...result.pokemon])
            setOffset(prev => prev + 20)
            setHasMore(result.hasMore)
            setError(null)
        } else if (result.pokemon.length === 0 && offset === 0) {
            setError('No Pokemon found')
        }
        setLoading(false)
    }, [offset, loading, hasMore, selectedType])

    // Initial load
    useEffect(() => {
        loadMorePokemon()
    }, [])

    // Reset and reload when type changes
    useEffect(() => {
        setPokemons([])
        setOffset(0)
        setHasMore(true)
        setLoading(true)
        
        const loadByType = async () => {
            const result = await fetchPokemonLazy(0, 20, selectedType)
            if (result.pokemon) {
                setPokemons(result.pokemon)
                setOffset(20)
                setHasMore(result.hasMore)
            }
            setLoading(false)
        }
        
        loadByType()
    }, [selectedType])

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                loadMorePokemon()
            }
        })

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current)
            }
        }
    }, [hasMore, loading, loadMorePokemon])

    if (error && pokemons.length === 0) return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <>
            {/* Type Filter Buttons */}
            <div className="p-6 bg-gray-50 border-b">
                
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedType(null)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedType === null
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                        }`}
                    >
                        All
                    </button>
                    {loadingTypes ? (
                        <div className="text-gray-500">Loading types...</div>
                    ) : (
                        types.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${
                                    selectedType === type
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                                }`}
                            >
                                {type}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 p-8">
                {pokemons.map((pokemon) => (
                    <div 
                        key={pokemon.id} 
                        className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer relative"
                        onMouseEnter={() => setHoveredId(pokemon.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                    {hoveredId === pokemon.id ? (
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white h-full flex flex-col justify-between min-h-64">
                            <div>
                                <h3 className="text-2xl font-bold capitalize mb-3">{pokemon.name}</h3>
                                <p className="text-sm font-semibold mb-2">ID: #{pokemon.id}</p>
                                
                                <div className="mb-3">
                                    <p className="text-xs font-semibold opacity-80 mb-1">TYPES:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {pokemon.types.map(type => (
                                            <span key={type} className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-semibold capitalize">
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <p className="text-xs font-semibold opacity-80">SIZE:</p>
                                    <p className="text-sm">Height: {pokemon.height}m | Weight: {pokemon.weight}kg</p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold opacity-80 mb-1">ABILITIES:</p>
                                    <p className="text-xs capitalize">{pokemon.abilities.slice(0, 2).join(', ')}</p>
                                </div>
                            </div>

                            <div className="text-xs">
                                <p className="font-semibold opacity-80 mb-2">STATS:</p>
                                <div className="space-y-1">
                                    {pokemon.stats.slice(0, 3).map(stat => (
                                        <div key={stat.name} className="flex justify-between">
                                            <span className="capitalize">{stat.name}:</span>
                                            <span className="font-bold">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-100 p-4 flex justify-center">
                                {pokemon.image ? (
                                    <img
                                        src={pokemon.image}
                                        alt={pokemon.name}
                                        className="h-40 w-40 object-contain"
                                    />
                                ) : (
                                    <div className="h-40 w-40 flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold capitalize text-center">
                                    {pokemon.name}
                                </h3>
                                
                            </div>
                        </>
                    )}
                </div>
            ))}
            </div>
            
            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="p-8 text-center">
                {loading && <div>Loading more Pokemon...</div>}
                {!hasMore && pokemons.length > 0 && <div className="text-gray-500">No more Pokemon to load</div>}
            </div>
        </>
    )
}   
export default Pokemon;