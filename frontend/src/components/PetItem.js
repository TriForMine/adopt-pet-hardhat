export function PetItem({ pet, adoptPet, disabled, inProgress }) {
    return (
        <div className="item">
            <div className="image">
                <img
                    src={pet.picture}
                    alt={pet.name}
                ></img>
            </div>
            <div className="info-holder">
                <div>
                    <b>Name:</b> {pet.name}
                </div>
                <div>
                    <b>Age:</b> {pet.age}
                </div>
                <div>
                    <b>Breed:</b> {pet.breed}
                </div>
                <div>
                    <b>Location:</b> {pet.location}
                </div>
                <div>
                    <b>Description:</b> {pet.description}
                </div>
            </div>
            <div className="action-menu">
                <button
                    className="action-button"
                    onClick={() => adoptPet(pet.id)}
                    disabled={disabled || inProgress}
                >
                    {
                        disabled ? "Happy in a new home" : "Adopt me!"
                    }
                </button>
            </div>
        </div>
    )
}
