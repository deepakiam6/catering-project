import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const Navbar = () => {
  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-3 py-3">
        {/* SHARED LAYOUT - works for both mobile and desktop */}
        <div className="flex items-center justify-between gap-2">
          
          {/* LEFT - Owner */}
          <div className="flex flex-col items-center flex-shrink-0">
            <img src="/images/owner.png" className="w-16 md:w-38" />
            <p className="text-xs md:text-sm tracking-widest">EST - 1989</p>
          </div>

          {/* CENTER */}
          <div className="text-center flex-1 min-w-0">
            <h1 className="text-lg md:text-4xl font-bold text-green-700 flex justify-center gap-1 leading-tight">
              MRS கேட்டரிங்ஸ் <span className="text-xs md:text-lg">®</span>
            </h1>

            <p className="text-gray-700 text-xs md:text-base">
              கோபி, ஈரோடு - 638456
            </p>

            <p className="font-semibold text-xs md:text-base">
              99655 55317, 98427 55317
            </p>

            <div className="flex justify-center gap-2 md:gap-4 mt-1 md:mt-2 text-xs md:text-sm flex-wrap">

              {/* Facebook */}
              <a
                href="https://www.facebook.com/mrscatering/?ref=NONE_xav_ig_profile_page_web#"
                target="_blank"
                className="flex items-center gap-1 "
              >
                <FaFacebookF className="text-blue-600"/>
                <span className="hidden sm:inline">MRS Caterings</span>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/mrs_caterings?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                className="flex items-center gap-1 "
              >
                <FaInstagram className="text-pink-600"/>
                <span className="hidden sm:inline">mrs_caterings</span>
              </a>

              {/* Email */}
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=mrscatering1989@gmail.com"
                className="flex items-center gap-1 "
                target="_blank" rel="noopener noreferrer"
              >
                <MdEmail className="text-red-600"/>
                <span className="hidden sm:inline">mrscatering1989@gmail.com</span>
              </a>

            </div>

            <p className="text-green-700 font-semibold mt-1 md:mt-2 text-xs md:text-base leading-tight">
              Premium Wedding - Traditional Events - Outdoor Catering
            </p>
          </div>

          {/* RIGHT - Logos */}
          <div className="flex flex-col items-center gap-1 md:gap-2 md:flex-row flex-shrink-0">
            <img src="/images/association.png" className="w-12 md:w-36" />
            <img src="/images/whatsapp.png" className="w-10 md:w-32" />
          </div>

        </div>
      </div>

      <div className="h-2 bg-green-700"></div>
    </div>
  );
};

export default Navbar;