import { useLocation } from "react-router-dom";

const DishDetails = () => {

  const location = useLocation();
  const event:any = location.state;

  const menuSections = [
    {
      title: "Welcome Drinks",
      items: ["ஜூஸ்", "பானகம்"]
    },
    {
      title: "Starter",
      items: ["சூப்", "ஜாங்கிரி", "பஜ்ஜி"]
    },
    {
      title: "Main Dishes",
      items: [
        "மினி இட்லி",
        "வெஜ் பிரியாணி",
        "சாம்பார்",
        "ரசம்",
        "குருமா"
      ]
    },
    {
      title: "Desserts",
      items: ["ஜிலேபி", "பாயாசம்"]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4">

      {/* HEADER */}
      <div className="text-center mb-6">

        <h1 className="text-2xl md:text-4xl font-bold text-green-700">
          {event?.nameTamil}
        </h1>

        <p className="text-gray-600">
          {event?.nameEnglish}
        </p>

        <p className="text-green-700 font-semibold">
          {event?.date}
        </p>

      </div>

      {/* MENU GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {menuSections.map((section, index) => (
          <div key={index} className="border p-4 rounded-lg shadow">

            <h2 className="font-bold text-lg border-b pb-2 mb-2">
              {section.title}
            </h2>

            <table className="w-full text-sm">

              <tbody>
                {section.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-1">• {item}</td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        ))}

      </div>

    </div>
  );
};

export default DishDetails;