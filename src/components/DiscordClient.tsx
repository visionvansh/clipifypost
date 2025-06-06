"use client";

import { useState, useEffect } from 'react';

interface CustomField {
  type: 'heading' | 'subheading';
  heading: string;
  value: string;
  valueStyle: string;
  valueSize: string;
}

export default function DiscordClient() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [status, setStatus] = useState('');
  const [templateType, setTemplateType] = useState('promotion');

  useEffect(() => {
    const initBot = async () => {
      try {
        console.log('Calling /api/init-bot...');
        const res = await fetch('/api/init-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.success) {
          console.log('Bot initialization successful:', data.message);
          setStatus('✅ Bot initialized successfully!');
        } else {
          console.error('Bot initialization failed:', data.error);
          setStatus(`❌ Failed to initialize bot: ${data.error}`);
        }
      } catch (err) {
        console.error('Error calling /api/init-bot:', err);
        setStatus(`❌ Failed to initialize bot: ${(err as Error).message}`);
      }
    };
    initBot();
  }, []);

  const addCustomField = (type: 'heading' | 'subheading') => {
    setCustomFields([...customFields, { type, heading: '', value: '', valueStyle: 'none', valueSize: 'normal' }]);
  };

  const removeCustomField = (index: number) => {
    const newFields = [...customFields];
    newFields.splice(index, 1);
    setCustomFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const channelId = formData.get('channelId') as string;
    const template = formData.get('templateType') as string;

    const payload: any = {
      channelId,
      templateType: template,
    };

    if (template === 'simple') {
      payload.message = formData.get('message') as string;
      payload.messageStyle = formData.get('messageStyle') as string;
      payload.messageSize = formData.get('messageSize') as string;
      payload.messageColor = formData.get('messageColor') as string;
    } else {
      payload.title = formData.get('title') as string;
      payload.titleStyle = formData.get('titleStyle') as string;
      payload.titleColor = formData.get('titleColor') as string;
      payload.footer = formData.get('footer') as string;
      payload.buttonLabel = formData.get('buttonLabel') as string;
      payload.buttonUrl = formData.get('buttonUrl') as string;
      payload.extraLines = parseInt(formData.get('extraLines') as string) || 0;

      if (template === 'rules' || template === 'announcement') {
        const fields: CustomField[] = customFields.map((_, index) => ({
          type: formData.get(`type${index + 1}`) as 'heading' | 'subheading',
          heading: formData.get(`heading${index + 1}`) as string,
          value: formData.get(`value${index + 1}`) as string,
          valueStyle: formData.get(`valueStyle${index + 1}`) as string,
          valueSize: formData.get(`valueSize${index + 1}`) as string,
        }));
        payload.customFields = fields;
        payload.mainHeading = formData.get('mainHeading') as string;
        payload.subheading = formData.get('subheading') as string;
        if (template === 'rules') {
          payload.subheadingDescription = formData.get('subheadingDescription') as string;
        }
      }
      if (template === 'promotion') {
        payload.description = formData.get('description') as string;
        // Removed descriptionStyle, descriptionSize, descriptionColor to keep raw Markdown formatting
      }
    }

    try {
      console.log('Sending message to /api/send-message...');
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('✅ Message sent successfully!');
        console.log('Message sent successfully');
      } else {
        setStatus(`❌ Failed to send message: ${data.error || 'Unknown error'}`);
        console.error('Failed to send message:', data.error);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setStatus(`❌ Failed to send message: ${(err as Error).message}`);
    }
  };

  return (
    <div className="w-full text-gray-200 bg-[#121212] p-2 sm:p-8 md:p-12 lg:p-15">
      <div className="flex items-center space-x-2 mb-4">
        <span className="w-6 h-6 text-yellow-500 glowing-icon">📢</span>
        <h2 className="text-3xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight glow-text">
          SEND MESSAGE AS CLIPIFY POST
        </h2>
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4"></div>

      <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
        <label htmlFor="channelId" className="text-yellow-300 font-semibold">Channel ID (Where to send the message):</label>
        <input
          type="text"
          id="channelId"
          name="channelId"
          placeholder="Enter the channel ID..."
          className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
          required
        />
        <div className="text-xs text-yellow-300 font-semibold">
          You can get the channel ID by enabling Developer Mode in Discord and right-clicking the channel to copy its ID.
        </div>

        <label htmlFor="templateType" className="text-yellow-300 font-semibold">Message Template:</label>
        <select
          id="templateType"
          name="templateType"
          className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
          value={templateType}
          onChange={(e) => {
            setTemplateType(e.target.value);
            setCustomFields([]);
          }}
        >
          <option value="promotion">Promotion</option>
          <option value="rules">Rules</option>
          <option value="announcement">Announcement</option>
          <option value="simple">Simple Message</option>
        </select>

        {templateType !== 'simple' && (
          <>
            <label htmlFor="title" className="text-yellow-300 font-semibold">Embed Title (max 256 characters):</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Enter the embed title..."
              defaultValue={
                templateType === 'rules' ? '📜 Server Rules' :
                templateType === 'announcement' ? '📢 New Announcement' : ''
              }
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
              required
              maxLength={256}
            />
            <div className="text-xs text-yellow-300 font-semibold">Titles longer than 256 characters will be truncated.</div>

            <label htmlFor="titleStyle" className="text-yellow-300 font-semibold">Title Style:</label>
            <select
              id="titleStyle"
              name="titleStyle"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
            >
              <option value="none">None</option>
              <option value="bold">Bold</option>
              <option value="italic">Italic</option>
              <option value="bold-italic">Bold & Italic</option>
            </select>

            <label htmlFor="titleColor" className="text-yellow-300 font-semibold">Title Color (Hex Code):</label>
            <input
              type="text"
              id="titleColor"
              name="titleColor"
              placeholder="e.g., #FFD700"
              defaultValue="#FFD700"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
            />

            {(templateType === 'rules' || templateType === 'announcement') && (
              <>
                <label htmlFor="mainHeading" className="text-yellow-300 font-semibold">Main Heading:</label>
                <input
                  type="text"
                  id="mainHeading"
                  name="mainHeading"
                  placeholder="Enter main heading..."
                  defaultValue={
                    templateType === 'rules' ? 'General Guidelines' :
                    'What’s New?'
                  }
                  className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                  required
                />

                <label htmlFor="subheading" className="text-yellow-300 font-semibold">Subheading:</label>
                <input
                  type="text"
                  id="subheading"
                  name="subheading"
                  placeholder="Enter subheading..."
                  defaultValue={
                    templateType === 'rules' ? 'Community Rules' :
                    'Details'
                  }
                  className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                  required
                />

                {templateType === 'rules' && (
                  <>
                    <label htmlFor="subheadingDescription" className="text-yellow-300 font-semibold">Subheading Description:</label>
                    <textarea
                      id="subheadingDescription"
                      name="subheadingDescription"
                      placeholder="Enter subheading description..."
                      defaultValue={`Welcome to the server! Please follow these rules to keep our community awesome:\n- **Respect all members**: Treat everyone, including staff, with kindness. No toxicity! 😊\n- **No spamming**: Avoid text walls, zalgo text, or tagging people unnecessarily. 🚫\n- **No advertising**: Don't promote other servers, items, or sketchy links. 🔗\n- **Do not tag staff for no reason**: Contact staff for help, but avoid pointless pings. 📢\n- **No NSFW content**: Keep it clean—no adult links, images, or content. 🛑\n- **No offensive profiles**: Profile names/pics with adult or offensive content must be changed. 🚫\n- **No impersonation**: Don’t pretend to be someone else, including staff. 🕵️\n- **Follow Discord ToS**: Adhere to Discord’s Terms of Service at all times. 📜`}
                      className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                      required
                    ></textarea>
                  </>
                )}
              </>
            )}

            {templateType === 'promotion' && (
              <>
                <label htmlFor="description" className="text-yellow-300 font-semibold">Description (Supports Markdown):</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter the description... Use **bold**, *italic*, and line breaks."
                  className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                  rows={6}
                  required
                ></textarea>
                <div className="text-xs text-yellow-300 font-semibold">
                  Use Markdown: **bold**, *italic*, line breaks, etc. will reflect in the embed as is.
                </div>
              </>
            )}

            <label htmlFor="extraLines" className="text-yellow-300 font-semibold">Extra Lines Before Footer:</label>
            <input
              type="number"
              id="extraLines"
              name="extraLines"
              min="0"
              defaultValue="0"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
            />
            <div className="text-xs text-yellow-300 font-semibold">
              Enter how many blank lines you want before the footer in the embed.
            </div>

            <label htmlFor="footer" className="text-yellow-300 font-semibold mt-8">Footer Text:</label>
            <input
              type="text"
              id="footer"
              name="footer"
              placeholder="Enter footer text..."
              defaultValue={
                templateType === 'rules' ? 'Clipify Post | Follow the Rules!' :
                'Clipify Post'
              }
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
              required
            />

            {(templateType === 'rules' || templateType === 'announcement') && (
              <>
                <label className="text-yellow-300 font-semibold">Custom Fields:</label>
                <div id="customFields" className="flex flex-col gap-4">
                  {customFields.map((field, index) => (
                    <div key={index} className="custom-field bg-[#1a1a1a] p-4 rounded-xl shadow-md">
                      <label htmlFor={`type${index + 1}`} className="text-yellow-300 font-semibold">Field Type:</label>
                      <select
                        id={`type${index + 1}`}
                        name={`type${index + 1}`}
                        className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                        value={field.type}
                        onChange={(e) => {
                          const newFields = [...customFields];
                          newFields[index].type = e.target.value as 'heading' | 'subheading';
                          setCustomFields(newFields);
                        }}
                      >
                        <option value="heading">Heading</option>
                        <option value="subheading">Subheading</option>
                      </select>

                      <label htmlFor={`heading${index + 1}`} className="text-yellow-300 font-semibold">{field.type === 'heading' ? 'Heading' : 'Subheading'}:</label>
                      <input
                        type="text"
                        id={`heading${index + 1}`}
                        name={`heading${index + 1}`}
                        placeholder={`Enter ${field.type}...`}
                        className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                        required
                      />

                      <label htmlFor={`value${index + 1}`} className="text-yellow-300 font-semibold">Value:</label>
                      <textarea
                        id={`value${index + 1}`}
                        name={`value${index + 1}`}
                        placeholder="Enter value (one per line)..."
                        className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                        required
                      ></textarea>

                      <label htmlFor={`valueStyle${index + 1}`} className="text-yellow-300 font-semibold">Value Style:</label>
                      <select
                        id={`valueStyle${index + 1}`}
                        name={`valueStyle${index + 1}`}
                        className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                      >
                        <option value="none">None</option>
                        <option value="bold">Bold</option>
                        <option value="italic">Italic</option>
                        <option value="bold-italic">Bold & Italic</option>
                      </select>

                      <label htmlFor={`valueSize${index + 1}`} className="text-yellow-300 font-semibold">Value Size (Visual Indicator):</label>
                      <select
                        id={`valueSize${index + 1}`}
                        name={`valueSize${index + 1}`}
                        className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="large">[Large]</option>
                        <option value="small">[Small]</option>
                      </select>

                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 px-4 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all shadow-md text-sm font-bold transform hover:scale-105 glow-item"
                          onClick={() => {
                            const textarea = document.getElementById(`value${index + 1}`) as HTMLTextAreaElement;
                            if (textarea) textarea.value = '[Click here](https://your-link)';
                          }}
                        >
                          Insert Link Placeholder
                        </button>
                        <button
                          type="button"
                          className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 px-4 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all shadow-md text-sm font-bold transform hover:scale-105 glow-item"
                          onClick={() => {
                            const textarea = document.getElementById(`value${index + 1}`) as HTMLTextAreaElement;
                            if (textarea) textarea.value = 'Sample content goes here!';
                          }}
                        >
                          Insert Sample Text
                        </button>
                        <button
                          type="button"
                          className="bg-gradient-to-r from-red-500 to-red-700 text-white py-2 px-4 rounded-xl hover:from-red-600 hover:to-red-800 hover:shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-all shadow-md text-sm font-bold transform hover:scale-105 glow-item"
                          onClick={() => removeCustomField(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 px-4 sm:p-4 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all shadow-md text-base font-bold tracking-wide transform hover:scale-105 glow-item"
                    onClick={() => addCustomField('heading')}
                  >
                    Add Heading 🚀
                  </button>
                  <button
                    type="button"
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 px-4 sm:p-4 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all shadow-md text-base font-bold tracking-wide transform hover:scale-105 glow-item"
                    onClick={() => addCustomField('subheading')}
                  >
                    Add Subheading 🚀
                  </button>
                </div>
              </>
            )}

            <label htmlFor="buttonLabel" className="text-yellow-300 font-semibold">Button Label (Optional):</label>
            <input
              type="text"
              id="buttonLabel"
              name="buttonLabel"
              placeholder="Enter button label (e.g., Join Now)"
              defaultValue=""
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
            />

            <label htmlFor="buttonUrl" className="text-yellow-300 font-semibold">Button URL (Optional):</label>
            <input
              type="text"
              id="buttonUrl"
              name="buttonUrl"
              placeholder="Enter button URL (e.g., https://example.com)"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
            />
          </>
        )}

        {templateType === 'simple' && (
          <>
            <label htmlFor="message" className="text-yellow-300 font-semibold">Message:</label>
            <textarea
              id="message"
              name="message"
              placeholder="Enter your message..."
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
              required
            ></textarea>

            <label htmlFor="messageStyle" className="text-yellow-300 font-semibold">Message Style:</label>
            <select
              id="messageStyle"
              name="messageStyle"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
            >
              <option value="none">None</option>
              <option value="bold">Bold</option>
              <option value="italic">Italic</option>
              <option value="bold-italic">Bold & Italic</option>
            </select>

            <label htmlFor="messageSize" className="text-yellow-300 font-semibold">Message Size (Visual Indicator):</label>
            <select
              id="messageSize"
              name="messageSize"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="small">Small</option>
            </select>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 px-4 sm:p-4 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all shadow-md text-base font-bold tracking-wide transform hover:scale-105 flex items-center justify-center gap-2 glow-item"
        >
          Send 🚀
        </button>
      </form>

      <p id="status" className="mt-4 text-yellow-300 font-semibold">{status}</p>

      <style jsx>{`
        .glowing-icon {
          filter: drop-shadow(0 0 5px rgba(234, 179, 8, 0.8));
        }
        .glow-text {
          text-shadow: 0 0 10px rgba(234, 179, 8, 0.5);
        }
        .glow-item {
          transition: all 0.3s ease-in-out;
        }
        .glow-item:focus, .glow-item:hover {
          box-shadow: 0 0 15px rgba(234, 179, 8, 0.8);
        }
        @media (max-width: 600px) {
          .w-full {
            padding: 10px;
          }
          input, textarea, select {
            font-size: 14px;
            padding: 8px;
          }
          button {
            padding: 8px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}