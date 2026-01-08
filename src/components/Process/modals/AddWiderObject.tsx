import React, { useEffect, useRef, useState } from "react";
import Modal from "../shared/Modal";

interface WiderCreateFormData {
  full_sn: string;
  place_name: string;
  who_entry: string;
  sito_basic_unnamed_place: string;
  free_plain_text: string;
}

interface WiderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WiderCreateFormData) => void;
  defaultWhoEntry?: string;
}

const WiderCreateModal: React.FC<WiderCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultWhoEntry = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<WiderCreateFormData>({
    full_sn: "",
    place_name: "",
    who_entry: defaultWhoEntry,
    sito_basic_unnamed_place: "",
    free_plain_text: "",
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal title="Dodaj nowy obiekt (rozszerzony)" onClose={onClose} hideFooter>
      <form onSubmit={handleSubmit}>
        <label>
          SN:
          <input
            ref={inputRef}
            value={formData.full_sn}
            onChange={(e) =>
              setFormData({ ...formData, full_sn: e.target.value })
            }
            required
          />
        </label>

        <label>
          Miejsce:
          <input
            value={formData.place_name}
            onChange={(e) =>
              setFormData({ ...formData, place_name: e.target.value })
            }
            required
          />
        </label>

        <label>
          Wprowadził:
          <input
            value={formData.who_entry}
            onChange={(e) =>
              setFormData({ ...formData, who_entry: e.target.value })
            }
            required
          />
        </label>

        <hr style={{ margin: "16px 0" }} />

        <label>
          Nazwa miejsca:
          <input
            value={formData.sito_basic_unnamed_place}
            onChange={(e) =>
              setFormData({
                ...formData,
                sito_basic_unnamed_place: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          Nazwa programu:
          <input
            value={formData.free_plain_text}
            onChange={(e) =>
              setFormData({
                ...formData,
                free_plain_text: e.target.value,
              })
            }
            required
          />
        </label>

        <div className="modal-footer">
          <button className="button-reset" type="submit">
            Zapisz
          </button>
          <button className="btn-normal" type="button" onClick={onClose}>
            Zamknij
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default WiderCreateModal;
